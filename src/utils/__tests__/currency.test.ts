import { formatCurrency, formatForInput, formatWithSign, getMonthName, parseToCents } from "../currency";

describe("Currency Utilities", () => {
  describe("formatCurrency", () => {
    it("should format cents to USD string", () => {
      expect(formatCurrency(1050)).toBe("$10.50");
    });

    it("should handle zero", () => {
      expect(formatCurrency(0)).toBe("$0.00");
    });

    it("should handle negative values", () => {
      expect(formatCurrency(-1050)).toBe("-$10.50");
    });

    it("should handle large values", () => {
      expect(formatCurrency(100000000)).toBe("$1,000,000.00");
    });
  });

  describe("formatForInput", () => {
    it("should format cents to decimal string without symbol", () => {
      expect(formatForInput(1050)).toBe("10.50");
    });

    it("should handle zero", () => {
      expect(formatForInput(0)).toBe("0.00");
    });
  });

  describe("parseToCents", () => {
    it("should parse simple decimal", () => {
      expect(parseToCents("10.50")).toBe(1050);
    });

    it("should parse integer", () => {
      expect(parseToCents("10")).toBe(1000);
    });

    it("should parse with currency symbol", () => {
      expect(parseToCents("$10.50")).toBe(1050);
    });

    it("should parse comma as decimal (European format)", () => {
      expect(parseToCents("10,50")).toBe(1050);
    });

    it("should return null for empty string", () => {
      expect(parseToCents("")).toBeNull();
    });

    it("should return null for invalid input", () => {
      expect(parseToCents("abc")).toBeNull();
    });

    it("should handle thousands with comma and period", () => {
      expect(parseToCents("1,000.50")).toBe(100050);
    });
  });

  describe("formatWithSign", () => {
    it("should add + for positive values", () => {
      const result = formatWithSign(1050);
      expect(result.text).toBe("+$10.50");
      expect(result.isPositive).toBe(true);
      expect(result.isNegative).toBe(false);
    });

    it("should not add prefix for negative values", () => {
      const result = formatWithSign(-1050);
      expect(result.text).toBe("-$10.50");
      expect(result.isPositive).toBe(false);
      expect(result.isNegative).toBe(true);
    });

    it("should handle zero", () => {
      const result = formatWithSign(0);
      expect(result.isPositive).toBe(false);
      expect(result.isNegative).toBe(false);
    });
  });

  describe("getMonthName", () => {
    it("should return correct month names", () => {
      expect(getMonthName(1)).toBe("January");
      expect(getMonthName(6)).toBe("June");
      expect(getMonthName(12)).toBe("December");
    });
  });
});
