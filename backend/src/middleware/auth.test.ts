import { Request, Response, NextFunction } from "express";
import { requireAdminKey } from "./auth";

describe("requireAdminKey middleware", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockRequest = {
      headers: {},
    };

    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };

    nextFunction = jest.fn();

    // Set up environment variable
    process.env.ADMIN_API_KEY = "test-secret-key";
  });

  afterEach(() => {
    delete process.env.ADMIN_API_KEY;
  });

  it("should return 401 when x-admin-key header is missing", () => {
    requireAdminKey(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction,
    );

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({
      error: "Missing x-admin-key header",
    });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it("should return 401 when x-admin-key header is invalid", () => {
    mockRequest.headers = { "x-admin-key": "wrong-key" };

    requireAdminKey(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction,
    );

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ error: "Invalid API key" });
    expect(nextFunction).not.toHaveBeenCalled();
  });

  it("should call next() when x-admin-key header is valid", () => {
    mockRequest.headers = { "x-admin-key": "test-secret-key" };

    requireAdminKey(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction,
    );

    expect(nextFunction).toHaveBeenCalled();
    expect(statusMock).not.toHaveBeenCalled();
    expect(jsonMock).not.toHaveBeenCalled();
  });

  it("should handle x-admin-key as array (edge case)", () => {
    mockRequest.headers = { "x-admin-key": ["test-secret-key", "extra"] };

    requireAdminKey(
      mockRequest as Request,
      mockResponse as Response,
      nextFunction,
    );

    // Should fail because array doesn't match string
    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({ error: "Invalid API key" });
    expect(nextFunction).not.toHaveBeenCalled();
  });
});
