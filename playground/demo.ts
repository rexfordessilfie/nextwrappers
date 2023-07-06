import { createWrapper } from "@nextwrappers/generic";
import { argv0 } from "process";

/**
 * @param a: some number
 */
function logNum(num: number) {
  console.log(`Your num: ${num}`);
  return num;
}

export const once = createWrapper((next) => {
  let done = false;

  if (!done) return next();
});

export const repeat = (times: number, delay = 1000) => {
  return createWrapper((next) => {
    let executed = 0;

    const interval = setInterval(() => {
      executed++;
      if (executed >= times) {
        clearInterval(interval);
      }
      next();
    }, delay);
  });
};

export function throttle(delay = 1000) {
  let wait = false;

  return createWrapper((next) => {
    if (wait) return;

    next();

    wait = true;

    setTimeout(() => {
      wait = false;
    }, delay);
  });
}

export function debounce(delay = 1000) {
  var time: NodeJS.Timeout;

  return createWrapper((next) => {
    clearTimeout(time);
    time = setTimeout(() => {
      next();
    }, delay);
  });
}

const exec = repeat(10)(logNum);
exec(3);
exec(10);
