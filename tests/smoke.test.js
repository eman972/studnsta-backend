describe("Studnsta API smoke", () => {
  test("quiz domain shuffle", () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || "testsecret";
    const { shuffle } = require("../src/utils/quizDomain");
    expect(shuffle([1, 2, 3]).length).toBe(3);
  });

  test("token helpers hash", () => {
    const { hashToken } = require("../src/utils/tokens");
    expect(hashToken("abc")).toHaveLength(64);
  });
});
