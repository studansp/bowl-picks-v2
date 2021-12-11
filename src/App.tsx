import React from 'react';

import { Amplify } from 'aws-amplify';
import { withAuthenticator } from '@aws-amplify/ui-react';

Amplify.configure({
  aws_cognito_region: 'us-east-1', // (required) - Region where Amazon Cognito project was created
  aws_user_pools_id: 'us-east-1_t9E1VJ4mA', // (optional) -  Amazon Cognito User Pool ID
  aws_user_pools_web_client_id: '1gs5daov64bncnpnaffb830mv0',
  // aws_cognito_identity_pool_id: ???
  aws_mandatory_sign_in: 'enable',
});

const App: React.FunctionComponent = () => (
  <div>
    <header>
      Hello world!
    </header>
  </div>
);

export default withAuthenticator(App);
