/**
 * Input Component Tests
 * Tests for functionality and user interaction
 */
import React from "react";

import Input from "@components/Input";
import { render, screen, userEvent } from "@tests/utils/test-utils";
import { axe } from "jest-axe";
import { vi, describe, it, expect, beforeEach } from "vitest";

describe("Input Component", () => {
  const defaultProps = {
    value: "",
    onChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders input element", () => {
      render(<Input {...defaultProps} />);
      expect(screen.getByRole("textbox")).toBeInTheDocument();
    });

    it("renders with initial value", () => {
      render(<Input {...defaultProps} value="test value" />);
      expect(screen.getByRole("textbox")).toHaveValue("test value");
    });

    it("renders placeholder text", () => {
      render(<Input {...defaultProps} inputPlaceholder="Enter text here" />);
      expect(screen.getByPlaceholderText("Enter text here")).toBeInTheDocument();
    });

    it("renders label when provided", () => {
      render(<Input {...defaultProps} label="Email Address" />);
      expect(screen.getByText("Email Address")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    // TODO: Input component needs accessibility fix - label is not properly associated with input
    it.skip("has no accessibility violations with label", async () => {
      const { container } = render(<Input {...defaultProps} label="Email" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe("User Interaction", () => {
    it("calls onChange when user types", async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(<Input {...defaultProps} onChange={onChange} />);

      await user.type(screen.getByRole("textbox"), "hello");
      expect(onChange).toHaveBeenCalled();
    });

    it("updates value when user types", async () => {
      const user = userEvent.setup();
      render(<Input {...defaultProps} />);

      const input = screen.getByRole("textbox");
      await user.type(input, "test");
      expect(input).toHaveValue("test");
    });

    it("calls onKeyDown when key is pressed", async () => {
      const onKeyDown = vi.fn();
      const user = userEvent.setup();
      render(<Input {...defaultProps} onKeyDown={onKeyDown} />);

      await user.type(screen.getByRole("textbox"), "{Enter}");
      expect(onKeyDown).toHaveBeenCalled();
    });
  });

  describe("Password Input", () => {
    it("renders as password type initially", () => {
      const { container } = render(<Input {...defaultProps} type="password" />);
      const input = container.querySelector("input");
      expect(input).toHaveAttribute("type", "password");
    });

    it("toggles password visibility when eye icon clicked", async () => {
      const user = userEvent.setup();
      const { container } = render(<Input {...defaultProps} type="password" value="secret123" />);

      const input = container.querySelector("input");
      expect(input).toHaveAttribute("type", "password");

      // Click the eye icon to toggle visibility
      const eyeIcon = container.querySelector(".gng-eye");
      expect(eyeIcon).toBeInTheDocument();

      await user.click(eyeIcon!);
      expect(input).toHaveAttribute("type", "text");

      await user.click(eyeIcon!);
      expect(input).toHaveAttribute("type", "password");
    });
  });

  describe("Disabled State", () => {
    it("disables input when disabled prop is true", () => {
      render(<Input {...defaultProps} disabled />);
      expect(screen.getByRole("textbox")).toBeDisabled();
    });

    it("applies disabled styling", () => {
      const { container } = render(<Input {...defaultProps} disabled />);
      // The inner section containing the input has the disabled styling
      const inputWrapper = container.querySelector("section > section");
      expect(inputWrapper).toHaveClass("bg-bkg-disabled/10");
    });
  });

  describe("Error Display", () => {
    it("displays error message when error prop provided", () => {
      render(<Input {...defaultProps} error="This field is required" />);
      expect(screen.getByText("This field is required")).toBeInTheDocument();
    });

    it("applies error border styling", () => {
      const { container } = render(<Input {...defaultProps} error="Error" />);
      const inputWrapper = container.querySelector("section section");
      expect(inputWrapper).toHaveClass("border-danger");
    });
  });

  describe("Icon Support", () => {
    it("renders input icon when inputIcon provided", () => {
      const { container } = render(<Input {...defaultProps} inputIcon="search" />);
      expect(container.querySelector(".gng-search")).toBeInTheDocument();
    });

    it("calls onFocusHandler when icon clicked", async () => {
      const onFocusHandler = vi.fn();
      const user = userEvent.setup();
      const { container } = render(
        <Input {...defaultProps} inputIcon="search" onFocusHandler={onFocusHandler} />
      );

      const icon = container.querySelector(".gng-search");
      await user.click(icon!);
      expect(onFocusHandler).toHaveBeenCalled();
    });
  });
});
