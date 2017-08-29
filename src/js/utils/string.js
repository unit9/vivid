const addLeadingZero = (num, zeros = 1) => {
  let string = String(num);

  for (let i = 0; i < zeros; i++) {
    if (num < Math.pow(10, (i + 1)) && num > -1) string = `0${string}`;
  }

  return string;
};

export { addLeadingZero };
