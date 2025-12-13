// Foreign imports for TournamentApi

export const fetchJsonImpl = (url) => (onSuccess) => (onError) => () => {
  console.log('[TournamentApi.js] Fetching:', url);

  fetch(url, {
    method: 'GET',
    mode: 'cors',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    }
  })
    .then(response => {
      console.log('[TournamentApi.js] Response status:', response.status);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log('[TournamentApi.js] Success, calling onSuccess');
      onSuccess(data)();
    })
    .catch(error => {
      console.log('[TournamentApi.js] Error:', error);
      onError(error.message)();
    });
};
