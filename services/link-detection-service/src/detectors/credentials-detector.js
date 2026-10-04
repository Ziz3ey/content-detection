function analyzeCredentials(parsedUrl) {
  if (!parsedUrl.username && !parsedUrl.password) {
    return null;
  }

  return {
    type: "url_credentials",
    description: "URL memuat username atau password sebelum hostname.",
  };
}

module.exports = { analyzeCredentials };
