const { isIP } = require("node:net");

function analyzeIpHostname(parsedUrl) {
  const hostname = parsedUrl.hostname.replace(/^\[|\]$/g, "");
  if (isIP(hostname) === 0) {
    return null;
  }

  return {
    type: "ip_hostname",
    description:
      "Hostname menggunakan alamat IP; ini merupakan indikator untuk ditinjau.",
  };
}

module.exports = { analyzeIpHostname };
