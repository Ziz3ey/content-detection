const { hashPassword } = require("../src/services/auth-service");

function readPassword() {
  const input = process.stdin;
  if (!input.isTTY || typeof input.setRawMode !== "function") {
    throw new Error("Jalankan perintah ini dari terminal interaktif.");
  }

  return new Promise((resolve, reject) => {
    let password = "";
    process.stderr.write("Kata sandi admin: ");
    input.setEncoding("utf8");
    input.setRawMode(true);
    input.resume();

    function finish(error) {
      input.setRawMode(false);
      input.pause();
      input.removeListener("data", onData);
      process.stderr.write("\n");
      if (error) reject(error);
      else resolve(password);
    }

    function onData(chunk) {
      for (const character of chunk) {
        if (character === "\u0003") {
          finish(new Error("Pembuatan hash dibatalkan."));
          return;
        }
        if (character === "\r" || character === "\n") {
          finish();
          return;
        }
        if (character === "\u007f" || character === "\b") {
          password = password.slice(0, -1);
        } else {
          password += character;
        }
      }
    }

    input.on("data", onData);
  });
}

async function main() {
  const password = await readPassword();
  if (password.length < 12 || password.length > 1024) {
    throw new Error("Kata sandi harus berisi 12 sampai 1024 karakter.");
  }
  process.stdout.write(`${hashPassword(password)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
