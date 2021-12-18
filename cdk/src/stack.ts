import * as apigateway from '@aws-cdk/aws-apigateway';
import * as cdk from '@aws-cdk/core';
import * as cognito from '@aws-cdk/aws-cognito';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import * as lambda from '@aws-cdk/aws-lambda';
import * as s3 from '@aws-cdk/aws-s3';
import * as route53 from '@aws-cdk/aws-route53';
import * as acm from '@aws-cdk/aws-certificatemanager';
import * as cloudfront from '@aws-cdk/aws-cloudfront';
import * as targets from '@aws-cdk/aws-route53-targets';
import * as deploy from '@aws-cdk/aws-s3-deployment';
import { ViewerProtocolPolicy } from '@aws-cdk/aws-cloudfront';
import { DynamoDBSeeder, Seeds } from '@cloudcomponents/cdk-dynamodb-seeder';
import { GAMES } from './games-seed';

const WEB_APP_DOMAIN = 'bowl-picks.com';
const WEB_APP_DOMAIN_WWW = `www.${WEB_APP_DOMAIN}`;

export class Stack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string) {
    super(scope, id, {
      env: {
        account: '507949713857',
        region: 'us-east-1',
      },
    });

    const gameTable = new dynamodb.Table(this, 'Game', {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
    });

    const picksTable = new dynamodb.Table(this, 'Picks', {
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      partitionKey: { name: 'username', type: dynamodb.AttributeType.STRING },
    });

    new DynamoDBSeeder(this, 'GameSeeder', {
      table: gameTable,
      seeds: Seeds.fromInline(GAMES),
    });

    const pool = new cognito.UserPool(this, 'UserPool', {
      standardAttributes: {
        email: {
          required: true,
          mutable: false,
        },
        phoneNumber: {
          required: false,
          mutable: false,
        },
      },
      mfa: cognito.Mfa.OPTIONAL,
      mfaSecondFactor: {
        sms: true,
        otp: true,
      },
      passwordPolicy: {
        minLength: 8,
      },
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
        phone: true,
        username: true,
      },
      userPoolName: 'bowl-picks-user-pool',
      userInvitation: {
        emailSubject: 'Invite to join bowl picks!',
        emailBody: 'Hello {username}, you have been invited to join bowl picks! Your temporary password is {####}',
        smsMessage: 'Hello {username}, your temporary password for bowl picks is {####}',
      },
      autoVerify: {
        email: true, phone: true,
      },
    });

    pool.addClient('BowlPicksClient', {
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
    });

    const createHandler = (functionName: string): lambda.Function => new lambda.Function(this, functionName, {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: `index.${functionName}`,
      code: lambda.AssetCode.fromAsset('../backend/build'),
      environment: {
        GAME_TABLE: gameTable.tableName,
        PICKS_TABLE: picksTable.tableName,
      },
    });

    const api = new apigateway.RestApi(this, 'Api', {
      description: 'BowlPicks backendAPI',
      defaultCorsPreflightOptions: {
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
        ],
        allowMethods: ['OPTIONS', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        allowCredentials: true,
        allowOrigins: ['http://localhost:3000'],
      },
      defaultMethodOptions: {
        authorizationType: apigateway.AuthorizationType.COGNITO,
        authorizer: new apigateway.CognitoUserPoolsAuthorizer(this, 'ApiGatewayAuthorizer', {
          cognitoUserPools: [pool],
        }),
      },
    });

    const apiRoot = api.root.addResource('api');

    const picksResource = apiRoot.addResource('picks');
    const picksResourceForUser = picksResource.addResource('{username}');

    const getPicksHandler = createHandler('getPicks');
    gameTable.grantReadData(getPicksHandler);
    picksTable.grantReadData(getPicksHandler);

    picksResourceForUser.addMethod('GET', new apigateway.LambdaIntegration(getPicksHandler, { proxy: true }));

    const gamesResource = apiRoot.addResource('games');

    const getGamesHandler = createHandler('getGames');
    gameTable.grantReadData(getGamesHandler);

    gamesResource.addMethod('GET', new apigateway.LambdaIntegration(getGamesHandler, { proxy: true }));

    const leadersResource = apiRoot.addResource('leaders');

    const getLeadersHandler = createHandler('getLeaders');
    gameTable.grantReadData(getLeadersHandler);
    picksTable.grantReadData(getLeadersHandler);

    leadersResource.addMethod('GET', new apigateway.LambdaIntegration(getLeadersHandler, { proxy: true }));

    const zone = route53.HostedZone.fromLookup(this, 'Zone', {
      domainName: WEB_APP_DOMAIN,
    });

    // Create S3 Bucket for our website
    const siteBucket = new s3.Bucket(this, 'SiteBucket', {
      bucketName: WEB_APP_DOMAIN,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: 'index.html',
      publicReadAccess: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create Certificate
    const siteCertificate = new acm.DnsValidatedCertificate(this, 'SiteCertificate', {
      domainName: WEB_APP_DOMAIN,
      hostedZone: zone,
      region: 'us-east-1', // standard for acm certs
      subjectAlternativeNames: [WEB_APP_DOMAIN_WWW],
    });

    // Create CloudFront Distribution
    const siteDistribution = new cloudfront.CloudFrontWebDistribution(this, 'SiteDistribution', {
      aliasConfiguration: {
        acmCertRef: siteCertificate.certificateArn,
        names: [WEB_APP_DOMAIN, WEB_APP_DOMAIN_WWW],
      },
      viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      originConfigs: [{
        customOriginSource: {
          domainName: siteBucket.bucketWebsiteDomainName,
          originProtocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
        },
        behaviors: [{
          isDefaultBehavior: true,
        }],
      }, {
        customOriginSource: {
          domainName: `${api.restApiId}.execute-api.${this.region}.${this.urlSuffix}`,
        },
        originPath: `/${api.deploymentStage.stageName}`,
        behaviors: [{
          defaultTtl: cdk.Duration.seconds(0),
          forwardedValues: {
            queryString: true,
            headers: ['Authorization'],
          },
          pathPattern: '/api/*',
          allowedMethods: cloudfront.CloudFrontAllowedMethods.ALL,
        }],
      }],
    });

    // Create A Record Custom Domain to CloudFront CDN
    new route53.ARecord(this, 'SiteRecord', {
      recordName: WEB_APP_DOMAIN,
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(siteDistribution)),
      zone,
    });
    new route53.ARecord(this, 'SiteRecordWWW', {
      recordName: WEB_APP_DOMAIN_WWW,
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(siteDistribution)),
      zone,
    });

    // Deploy site to s3
    new deploy.BucketDeployment(this, 'Deployment', {
      sources: [deploy.Source.asset('../frontend/build')],
      destinationBucket: siteBucket,
      distribution: siteDistribution,
      distributionPaths: ['/*'],
    });
  }
}
