import { generateVideoId } from "./idGenerator";

describe("generateVideoId", () => {
  test("should generate ID with correct format", () => {
    const id = generateVideoId();

    // Should start with "v_"
    expect(id).toMatch(/^v_/);

    // Should be exactly 10 characters total (v_ + 8 chars)
    expect(id).toHaveLength(10);

    // Should only contain alphanumeric characters after "v_"
    expect(id).toMatch(/^v_[a-zA-Z0-9]{8}$/);
  });

  test("should generate unique IDs", () => {
    const ids = new Set<string>();
    const count = 100;

    for (let i = 0; i < count; i++) {
      ids.add(generateVideoId());
    }

    // All IDs should be unique
    expect(ids.size).toBe(count);
  });

  test("should use all alphanumeric characters", () => {
    // Generate many IDs to ensure we're using the full character set
    const ids: string[] = [];
    for (let i = 0; i < 1000; i++) {
      ids.push(generateVideoId());
    }

    const allChars = ids.join("").replace(/v_/g, "");

    // Should contain lowercase letters
    expect(allChars).toMatch(/[a-z]/);

    // Should contain uppercase letters
    expect(allChars).toMatch(/[A-Z]/);

    // Should contain digits
    expect(allChars).toMatch(/[0-9]/);
  });
});
