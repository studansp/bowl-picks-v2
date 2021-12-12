import React, { useEffect, useState } from 'react';

import { withAuthenticator } from '@aws-amplify/ui-react';
import { getPicks, Picks } from '../data';
import { PicksGrid } from './PicksGrid';

const App: React.FunctionComponent = () => {
  const [picks, setPicks] = useState<Picks | null>(null);

  const setup = async () => setPicks(await getPicks());

  useEffect(() => {
    setup();
  }, []);

  if (picks === null) {
    return (
      <div>
        <header>
          Hello world!
        </header>
      </div>
    );
  }

  return (
    <PicksGrid picks={picks} />
  );
};

export default withAuthenticator(App);
