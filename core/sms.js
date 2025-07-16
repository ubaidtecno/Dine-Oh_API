const accountSid = "AC1784cc2b43811a621ece828e890ce08a";
const authToken = "7edf119d9c9d6682d7aa8f1d70fd4455";
const client = require("twilio")(accountSid, authToken);

let send = async (mobile, message) => {
  return await client.messages
    .create({
      body: message,
      from: "+17032159699",
      to: mobile,
    })

    .then((messages) => {
      console.log(messages);
      return true;
    })
    .catch((err) => {
      console.log(err);
      return false;
    });
};

module.exports = {
  send,
};
