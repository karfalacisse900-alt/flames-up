import { QueryClient } from '@tanstack/react-query';


export const queryClientInstance = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 0,        // always consider data stale — never serve from cache
			gcTime: 0,           // never persist query results in memory between mounts
			refetchOnWindowFocus: true,  // re-fetch whenever user returns to the tab/app
			retry: 1,
		},
	},
});