import {
  validateTitle,
  validateIframeEmbed,
  validateTags,
  sanitizeIframeEmbed,
} from "./validators";

describe("validateTitle", () => {
  test("accepts valid title with 3+ characters", () => {
    const result = validateTitle("Valid Title");
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  test("accepts title with exactly 3 characters", () => {
    const result = validateTitle("abc");
    expect(result.valid).toBe(true);
  });

  test("rejects title with less than 3 characters", () => {
    const result = validateTitle("ab");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Title must be at least 3 characters long");
  });

  test("rejects empty title", () => {
    const result = validateTitle("");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Title is required");
  });

  test("rejects whitespace-only title", () => {
    const result = validateTitle("   ");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Title is required");
  });

  test("trims whitespace when checking length", () => {
    const result = validateTitle("  ab  ");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Title must be at least 3 characters long");
  });
});

describe("validateIframeEmbed", () => {
  test("accepts valid iframe embed", () => {
    const embed = '<iframe src="https://example.com"></iframe>';
    const result = validateIframeEmbed(embed);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  test("accepts iframe with uppercase tags", () => {
    const embed = '<IFRAME SRC="https://example.com"></IFRAME>';
    const result = validateIframeEmbed(embed);
    expect(result.valid).toBe(true);
  });

  test("rejects empty embed", () => {
    const result = validateIframeEmbed("");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("iframeEmbed is required");
  });

  test("rejects embed without iframe tag", () => {
    const result = validateIframeEmbed('<div src="https://example.com"></div>');
    expect(result.valid).toBe(false);
    expect(result.error).toBe("iframeEmbed must contain an <iframe> tag");
  });

  test("rejects embed without src attribute", () => {
    const result = validateIframeEmbed("<iframe></iframe>");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("iframeEmbed must contain a src attribute");
  });

  test("rejects embed with only iframe but no src", () => {
    const result = validateIframeEmbed(
      '<iframe width="560" height="315"></iframe>',
    );
    expect(result.valid).toBe(false);
    expect(result.error).toBe("iframeEmbed must contain a src attribute");
  });
});

describe("validateTags", () => {
  test("accepts empty tags array", () => {
    const result = validateTags([]);
    expect(result.valid).toBe(true);
  });

  test("accepts tags array with 10 items", () => {
    const tags = Array(10).fill("tag");
    const result = validateTags(tags);
    expect(result.valid).toBe(true);
  });

  test("rejects tags array with more than 10 items", () => {
    const tags = Array(11).fill("tag");
    const result = validateTags(tags);
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Maximum of 10 tags allowed");
  });

  test("accepts tags array with 1 item", () => {
    const result = validateTags(["tag1"]);
    expect(result.valid).toBe(true);
  });
});

describe("sanitizeIframeEmbed", () => {
  test("returns unchanged embed without script tags", () => {
    const embed = '<iframe src="https://example.com"></iframe>';
    const result = sanitizeIframeEmbed(embed);
    expect(result).toBe(embed);
  });

  test("strips script tags from embed", () => {
    const embed =
      '<iframe src="https://example.com"></iframe><script>alert("xss")</script>';
    const result = sanitizeIframeEmbed(embed);
    expect(result).toBe('<iframe src="https://example.com"></iframe>');
    expect(result).not.toContain("<script>");
  });

  test("strips multiple script tags", () => {
    const embed =
      '<script>bad()</script><iframe src="https://example.com"></iframe><script>worse()</script>';
    const result = sanitizeIframeEmbed(embed);
    expect(result).toBe('<iframe src="https://example.com"></iframe>');
  });

  test("strips script tags with attributes", () => {
    const embed =
      '<iframe src="https://example.com"></iframe><script type="text/javascript">alert("xss")</script>';
    const result = sanitizeIframeEmbed(embed);
    expect(result).not.toContain("<script");
  });

  test("strips multiline script tags", () => {
    const embed = `<iframe src="https://example.com"></iframe>
<script>
  alert("xss");
  console.log("bad");
</script>`;
    const result = sanitizeIframeEmbed(embed);
    expect(result).not.toContain("<script>");
    expect(result).toContain("<iframe");
  });

  test("throws error for javascript: protocol", () => {
    const embed = '<iframe src="javascript:alert(1)"></iframe>';
    expect(() => sanitizeIframeEmbed(embed)).toThrow(
      "Invalid iframe: javascript: protocol not allowed",
    );
  });

  test("throws error for javascript: protocol in uppercase", () => {
    const embed = '<iframe src="JAVASCRIPT:alert(1)"></iframe>';
    expect(() => sanitizeIframeEmbed(embed)).toThrow(
      "Invalid iframe: javascript: protocol not allowed",
    );
  });

  test("throws error for javascript: protocol with mixed case", () => {
    const embed = '<iframe src="JaVaScRiPt:alert(1)"></iframe>';
    expect(() => sanitizeIframeEmbed(embed)).toThrow(
      "Invalid iframe: javascript: protocol not allowed",
    );
  });

  test("handles script tags with case variations", () => {
    const embed =
      '<iframe src="https://example.com"></iframe><SCRIPT>alert("xss")</SCRIPT>';
    const result = sanitizeIframeEmbed(embed);
    expect(result).not.toContain("SCRIPT");
    expect(result).toContain("<iframe");
  });
});
