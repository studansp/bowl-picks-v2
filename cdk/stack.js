"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Stack = void 0;
const cdk = require("@aws-cdk/core");
const cognito = require("@aws-cdk/aws-cognito");
const s3 = require("@aws-cdk/aws-s3");
const route53 = require("@aws-cdk/aws-route53");
const acm = require("@aws-cdk/aws-certificatemanager");
const cloudfront = require("@aws-cdk/aws-cloudfront");
const targets = require("@aws-cdk/aws-route53-targets");
const deploy = require("@aws-cdk/aws-s3-deployment");
const aws_cloudfront_1 = require("@aws-cdk/aws-cloudfront");
const WEB_APP_DOMAIN = 'bowl-picks.com';
class Stack extends cdk.Stack {
    constructor(scope, id) {
        super(scope, id, {
            env: {
                account: '507949713857',
                region: 'us-east-1',
            },
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
            viewerCertificate: aws_cloudfront_1.ViewerCertificate.fromAcmCertificate(siteCertificate),
            viewerProtocolPolicy: aws_cloudfront_1.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            originConfigs: [{
                    customOriginSource: {
                        domainName: siteBucket.bucketWebsiteDomainName,
                        originProtocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
                    },
                    behaviors: [{
                            isDefaultBehavior: true,
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
            sources: [deploy.Source.asset('./build')],
            destinationBucket: siteBucket,
            distribution: siteDistribution,
            distributionPaths: ['/*'],
        });
    }
}
exports.Stack = Stack;
