export function createDraftsHttp(http) {
  return function request(options) {
    return http.request({
      ...options,
      encoding: "json",
    });
  };
}
