const PI = Math.PI;
const TWO_PI = Math.PI * 2;
const HALF_PI = Math.PI / 2;

const random = (min, max) => {
  if (min && min.length) return min[ ~~(Math.random() * min.length)];
  if (typeof max != 'number') max = min || 1, min = 0;
  return min + Math.random() * (max - min);
};

const randomInt = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min; //The maximum is inclusive and the minimum is inclusive
};

const easeOutQuad = (t, b, c, d) => {
  t /= d;
  return -c * t*(t-2) + b;
};

const clamp = (value, min, max) => {
  return Math.max( min, Math.min( max, value ) );
};

const mapValue =  (arg, from1, to1, from2, to2) => {
        return (arg - from1) / (to1 - from1) * (to2 - from2) + from2
}

export { PI, TWO_PI, HALF_PI, random, easeOutQuad, clamp, randomInt, mapValue };
