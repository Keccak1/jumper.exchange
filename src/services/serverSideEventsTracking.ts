export type AdditionalData = {
  [key: string]:
    | string
    | number
    | boolean
    | undefined
    | AdditionalData
    | AdditionalData[];
};

type Event = {
  name: string;
  data: AdditionalData;
};
type EndpointTypes = 'isLoggedIn' | 'logIn' | 'metrics';

const Endpoints: Record<EndpointTypes, string> = {
  isLoggedIn: 'auth/is-logged-in',
  logIn: 'auth/log-in',
  metrics: 'metrics',
};

async function request(
  method: 'POST' | 'GET',
  endpoint: EndpointTypes,
  body?: BodyInit,
) {
  return fetch(
    `${import.meta.env.VITE_SERVER_SIDE_TRACKING_URI}${Endpoints[endpoint]}`,
    {
      method,
      body,
      headers: method === 'POST' ? { 'Content-Type': 'application/json' } : {},
      credentials: 'include',
    },
  );
}

export const trackServerSideEvent = async ({ name, data }: Event) => {
  let isLoggedIn = true;

  try {
    const res = await request('GET', 'isLoggedIn');
    isLoggedIn = res.ok;
  } catch (error: unknown) {
    console.debug('User not logged in');
    isLoggedIn = false;
  }

  if (!isLoggedIn) {
    try {
      const res = await request('POST', 'logIn');
      isLoggedIn = res.ok;
    } catch (error: unknown) {
      console.error('Error during logging', error);
    }
  }

  if (isLoggedIn) {
    try {
      await request(
        'POST',
        'metrics',
        JSON.stringify({
          name,
          data,
        }),
      );
    } catch (error: unknown) {
      console.error('Error during tracking', error);
    }
  } else {
    console.error('User not logged in, cannot send tracking event');
  }
};
