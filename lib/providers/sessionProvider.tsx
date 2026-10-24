'use client';

import {SessionProvider} from 'next-auth/react';

export const SessionsProvider = ({children}) => {
  return <SessionProvider>{children}</SessionProvider>;
};
