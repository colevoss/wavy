export const data = (count = 200) => {
  let d = [];
  for (let i = 0; i < count; i++) {
    d.push([
      Math.round(Math.random() * (200 - 100) + 100),
      Math.round(Math.random() * (100 - 0) + 0),
    ]);
  }

  return d;
};
