module.exports = (data, message = "", fields = "", isError = 0) => {
  let response = {
    data: data,
    error: {
      code: isError,
      message: message,
      fields: fields,
    },
  };

  return response;
};
