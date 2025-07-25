// @vitest-environment jsdom

import { ProxyConsole } from "../shared/src/proxy-console";

const LEVELS = ["trace", "debug", "info", "log", "warn", "error"] as const;

const levelsForEach = LEVELS.map((level) => ({
  level,
}));

const simpleFormat = (x: string) => x;

describe("proxy-console", () => {
  let originalConsole: typeof console;
  beforeAll(() => {
    originalConsole = { ...console };
  });

  beforeEach(() => {
    // Reset the console to its original state before each test
    window.console = { ...originalConsole };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should replace console methods when .on is called", () => {
    const proxy = new ProxyConsole(window.console, simpleFormat);

    proxy.on();

    for (const level of LEVELS) {
      expect(window.console[level]).not.toEqual(originalConsole[level]);
    }
  });

  it("should restore console methods when .off is called", () => {
    const proxy = new ProxyConsole(window.console, simpleFormat);

    proxy.on();
    proxy.off();

    for (const level of LEVELS) {
      expect(window.console[level]).toEqual(originalConsole[level]);
    }
  });

  it.each(levelsForEach)(
    "should proxy to the original console.$level",
    ({ level }) => {
      const logSpy = vi
        .spyOn(window.console, level)
        .mockImplementation(vi.fn());
      const proxy = new ProxyConsole(window.console, simpleFormat);

      proxy.on();
      window.console[level]("test message");

      expect(logSpy).toHaveBeenCalledWith("test message");
    },
  );

  describe("flush", () => {
    it("should not have a logs property if no calls were recorded", () => {
      const proxy = new ProxyConsole(window.console, simpleFormat);

      proxy.on();
      const results = proxy.flush();

      expect(results).toEqual({});
    });

    it("should return all the calls recorded while proxying", () => {
      vi.spyOn(window.console, "log").mockImplementation(vi.fn());
      vi.spyOn(window.console, "warn").mockImplementation(vi.fn());
      const proxy = new ProxyConsole(window.console, simpleFormat);
      proxy.on();

      window.console.log("test message 1");
      window.console.warn("test message 2");
      const results = proxy.flush();

      expect(results.logs).toEqual([
        { level: "log", msg: "test message 1" },
        { level: "warn", msg: "test message 2" },
      ]);
    });

    it("should clear the calls after flushing", () => {
      vi.spyOn(window.console, "log").mockImplementation(vi.fn());
      const proxy = new ProxyConsole(window.console, simpleFormat);
      proxy.on();

      window.console.log("test message 1");
      proxy.flush();
      const results = proxy.flush();

      expect(results).toEqual({});
    });
  });
});
