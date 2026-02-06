/**
 * TextArea Component Tests
 * Tests for word limit and user interaction
 */
import React from "react";

import TextArea from "@components/TextArea";
import { render, screen, userEvent } from "@tests/utils/test-utils";
import { axe } from "jest-axe";
import { vi, describe, it, expect, beforeEach } from "vitest";

describe("TextArea Component", () => {
  const defaultProps = {
    value: "",
    onChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders textarea element", () => {
      render(<TextArea {...defaultProps} />);
      expect(screen.getByRole("textbox")).toBeInTheDocument();
    });

    it("renders with initial value", () => {
      render(<TextArea {...defaultProps} value="Initial content" />);
      expect(screen.getByRole("textbox")).toHaveValue("Initial content");
    });

    it("renders placeholder text", () => {
      render(<TextArea {...defaultProps} placeholder="Type your message..." />);
      expect(screen.getByPlaceholderText("Type your message...")).toBeInTheDocument();
    });

    it("renders default placeholder when not provided", () => {
      render(<TextArea {...defaultProps} />);
      expect(screen.getByPlaceholderText("Write here...")).toBeInTheDocument();
    });

    it("renders with specified rows", () => {
      render(<TextArea {...defaultProps} rows={6} />);
      expect(screen.getByRole("textbox")).toHaveAttribute("rows", "6");
    });
  });

  describe("Accessibility", () => {
    it("has no accessibility violations", async () => {
      const { container } = render(<TextArea {...defaultProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe("User Interaction", () => {
    it("calls onChange when user types", async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(<TextArea {...defaultProps} onChange={onChange} />);

      await user.type(screen.getByRole("textbox"), "hello");
      expect(onChange).toHaveBeenCalled();
    });

    it("updates value when user types", async () => {
      const user = userEvent.setup();
      render(<TextArea {...defaultProps} />);

      const textarea = screen.getByRole("textbox");
      await user.type(textarea, "test content");
      expect(textarea).toHaveValue("test content");
    });

    it("calls onKeyDown when key is pressed", async () => {
      const onKeyDown = vi.fn();
      const user = userEvent.setup();
      render(<TextArea {...defaultProps} onKeyDown={onKeyDown} />);

      await user.type(screen.getByRole("textbox"), "{Enter}");
      expect(onKeyDown).toHaveBeenCalled();
    });
  });

  describe("Word Limit", () => {
    it("shows word limit reached message when limit is hit", async () => {
      const user = userEvent.setup();
      render(<TextArea {...defaultProps} wordLimit={3} />);

      // Type words to trigger limit (component counts words by splitting on space)
      await user.type(screen.getByRole("textbox"), "one two ");
      expect(screen.getByText("Word limit reached!")).toBeInTheDocument();
    });

    it("prevents typing beyond word limit", async () => {
      const user = userEvent.setup();
      render(<TextArea {...defaultProps} wordLimit={3} />);

      const textarea = screen.getByRole("textbox");
      await user.type(textarea, "one two three four five");

      // Content should stop at word limit
      const words = (textarea as HTMLTextAreaElement).value.split(" ");
      expect(words.length).toBeLessThanOrEqual(3);
    });

    it("applies danger styling when limit reached", async () => {
      const user = userEvent.setup();
      render(<TextArea {...defaultProps} wordLimit={2} />);

      await user.type(screen.getByRole("textbox"), "one ");
      const wordCountElement = screen.getByText("Word limit reached!");
      expect(wordCountElement).toHaveClass("text-danger");
    });
  });

  describe("Disabled State", () => {
    it("disables textarea when disabled prop is true", () => {
      render(<TextArea {...defaultProps} disabled />);
      expect(screen.getByRole("textbox")).toBeDisabled();
    });

    it("does not call onChange when disabled and typed", async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(<TextArea {...defaultProps} disabled onChange={onChange} />);

      await user.type(screen.getByRole("textbox"), "test");
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe("Reset Editor", () => {
    it("clears content when resetEditor prop changes to true", () => {
      const { rerender } = render(
        <TextArea {...defaultProps} value="some content" resetEditor={false} />
      );

      expect(screen.getByRole("textbox")).toHaveValue("some content");

      rerender(<TextArea {...defaultProps} value="some content" resetEditor={true} />);
      expect(screen.getByRole("textbox")).toHaveValue("");
    });
  });

  describe("Children Rendering", () => {
    it("renders children elements", () => {
      render(
        <TextArea {...defaultProps}>
          <button data-testid="custom-button">Custom</button>
        </TextArea>
      );
      expect(screen.getByTestId("custom-button")).toBeInTheDocument();
    });
  });
});
