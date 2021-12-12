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
import { ViewerCertificate, ViewerProtocolPolicy } from '@aws-cdk/aws-cloudfront';
import { DynamoDBSeeder, Seeds } from '@cloudcomponents/cdk-dynamodb-seeder';
import { GAMES } from './games-seed';

const WEB_APP_DOMAIN = 'bowl-picks.com';

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

    const tables = [
      new dynamodb.Table(this, 'Picks', {
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        partitionKey: { name: 'username', type: dynamodb.AttributeType.STRING },
      }),
      gameTable,
    ];

    new DynamoDBSeeder(this, 'GameSeeder', {
      table: gameTable,
      seeds: Seeds.fromInline(GAMES),
    });

    const pool = new cognito.UserPool(this, 'UserPool', {
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
      userVerification: {
        emailSubject: 'Verify your email to sign up for bowl picks!',
        emailBody: 'Thanks for signing up! Your verification code is {####}',
        emailStyle: cognito.VerificationEmailStyle.CODE,
        smsMessage: 'Thanks for signing up! Your verification code is {####}',
      },
    });

    pool.addClient('BowlPicksClient', {
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
    });

    const handler = new lambda.Function(this, 'BackendLambda', {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'index.handler',
      code: lambda.AssetCode.fromAsset('../backend/build'),
    });

    tables.forEach((table) => table.grantReadWriteData(handler));

    const api = new apigateway.LambdaRestApi(this, 'ApiGateway', {
      handler,
      proxy: true,
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
      defaultMethodOptions: {
        authorizationType: apigateway.AuthorizationType.COGNITO,
        authorizer: new apigateway.CognitoUserPoolsAuthorizer(this, 'ApiGatewayAuthorizer', {
          cognitoUserPools: [pool],
        }),
      },
    });

    const zone = route53.HostedZone.fromLookup(this, 'Zone', {
      domainName: WEB_APP_DOMAIN,
    });

    // Create S3 Bucket for our website
    const siteBucket = new s3.Bucket(this, 'SiteBucket', {
      bucketName: WEB_APP_DOMAIN,
      websiteIndexDocument: 'index.html',
      publicReadAccess: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create Certificate
    const siteCertificate = new acm.DnsValidatedCertificate(this, 'SiteCertificate', {
      domainName: WEB_APP_DOMAIN,
      hostedZone: zone,
      region: 'us-east-1', // standard for acm certs
    });

    // Create CloudFront Distribution
    const siteDistribution = new cloudfront.CloudFrontWebDistribution(this, 'SiteDistribution', {
      viewerCertificate: ViewerCertificate.fromAcmCertificate(siteCertificate),
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

    // Deploy site to s3
    new deploy.BucketDeployment(this, 'Deployment', {
      sources: [deploy.Source.asset('../frontend/build')],
      destinationBucket: siteBucket,
      distribution: siteDistribution,
      distributionPaths: ['/*'],
    });
  }
}
