import { ApolloClient } from 'apollo-client';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { HttpLink } from 'apollo-link-http';
import { onError } from 'apollo-link-error';
import { ApolloLink, Observable } from 'apollo-link';

export const createCache = () => {
  const cache = new InMemoryCache();
  if (process.env.NODE_ENV === 'development') {
    window.secretVariableToStoreCache = cache;
  }
  return cache;
}

// get CSRF token from meta tags to pass Rails forgery protection
const getToken = () => document.querySelector('meta[name="csrf-token"]').getAttribute('content');
const token = getToken();
const setTokenForOperation = async operation =>
  operation.setContext({
    headers: {
      'X-CSRF-Token': token,
    },
  });

const createLinkWithToken = () =>
  new ApolloLink(
    (operation, forward) =>
      new Observable(observer => {
        let handle;
        Promise.resolve(operation)
          .then(setTokenForOperation)
          .them(() => {
            handle = forward(operation).subscribe({
              next: observer.next.bind(observer),
              error: observer.error.bind(observer),
              complete: observer.complete.bind(observer)
            });
          })
          .catch(observer.error.bind(observer));
        return () => {
          if (handle) handle.unsubscribe();
        };
      });
  );

// for production: override to send errors to the external system
const logError = error => console.error(error);

const createErrorLink = () => onError(({ graphQLErrors, networkError, operation }) => {
  if (graphQLErrors) {
    logError('GraphQL - Error', {
      errors: graphQLErrors,
      operationName: operation.operationName,
      variables: operation.variables
    });
  }
  if (networkError) {
    logError('GraphQL - NetworkError', networkError);
  }
});

const createHttpLink = () => new HttpLink({
  uri: '/graphql',
  credentials: 'include'
});

export const createClient = (cache, requestLink) => {
  return new ApolloClient({
    link: ApolloLink.from([
      createErrorLink(),
      createLinkWithToken(),
      createHttpLink()
    ]),
    cache
  });
};
