/**
 * Accordion Component Tests
 * Tests for expand/collapse behavior
 */
import React from "react";

import Accordion from "@components/Accordion";
import { render, screen, userEvent, waitFor } from "@tests/utils/test-utils";
import { vi, describe, it, expect, beforeEach } from "vitest";

describe("Accordion Component", () => {
  const defaultProps = {
    isOpen: false,
    children: <div data-testid="accordion-content">Accordion Content</div>,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders accordion section", () => {
      const { container } = render(<Accordion {...defaultProps} />);
      expect(container.querySelector("section")).toBeInTheDocument();
    });

    it("renders title when provided", () => {
      render(<Accordion {...defaultProps} title="Section Title" />);
      expect(screen.getByText("Section Title")).toBeInTheDocument();
    });

    it("has max-h-0 class when closed", () => {
      const { container } = render(<Accordion {...defaultProps} isOpen={false} />);
      const contentDiv = container.querySelector(".max-h-0");
      expect(contentDiv).toBeInTheDocument();
    });

    it("has max-h-[350vh] class when open", async () => {
      const { container } = render(<Accordion {...defaultProps} isOpen={true} />);
      await waitFor(() => {
        const contentDiv = container.querySelector(".max-h-\\[350vh\\]");
        expect(contentDiv).toBeInTheDocument();
      });
    });
  });

  describe("Static Mode", () => {
    it("always has expanded class when static", () => {
      const { container } = render(<Accordion {...defaultProps} isStatic={true} isOpen={false} />);
      const contentDiv = container.querySelector(".max-h-\\[350vh\\]");
      expect(contentDiv).toBeInTheDocument();
    });

    it("does not show arrow icon when static", () => {
      const { container } = render(<Accordion {...defaultProps} isStatic={true} />);
      expect(container.querySelector(".gng-arrow-down-thin")).not.toBeInTheDocument();
    });

    it("has cursor-default class when static", () => {
      const { container } = render(<Accordion {...defaultProps} title="Static" isStatic={true} />);
      const header = container.querySelector(".cursor-default");
      expect(header).toBeInTheDocument();
    });
  });

  describe("Click Behavior", () => {
    it("toggles when header is clicked", async () => {
      const user = userEvent.setup();
      const { container } = render(
        <Accordion {...defaultProps} title="Click Test" isOpen={false} />
      );

      const header = container.querySelector("#accordion-header");
      expect(header).toBeInTheDocument();

      await user.click(header!);

      await waitFor(() => {
        const contentDiv = container.querySelector(".max-h-\\[350vh\\]");
        expect(contentDiv).toBeInTheDocument();
      });
    });
  });

  describe("Action Icons", () => {
    it("renders primary action icon when accordion is open", async () => {
      const { container } = render(
        <Accordion
          {...defaultProps}
          title="Actions"
          isOpen={true}
          primaryActionIconBtn={{
            icon: "edit",
            action: vi.fn(),
          }}
        />
      );

      await waitFor(() => {
        expect(container.querySelector(".gng-edit")).toBeInTheDocument();
      });
    });

    it("renders secondary action icon", () => {
      const { container } = render(
        <Accordion
          {...defaultProps}
          title="Actions"
          secondaryActionIconBtn={{
            icon: "delete",
            action: vi.fn(),
          }}
        />
      );

      expect(container.querySelector(".gng-delete")).toBeInTheDocument();
    });

    it("calls action function when icon clicked", async () => {
      const actionFn = vi.fn();
      const user = userEvent.setup();

      const { container } = render(
        <Accordion
          {...defaultProps}
          title="Actions"
          secondaryActionIconBtn={{
            icon: "delete",
            action: actionFn,
          }}
        />
      );

      const deleteIcon = container.querySelector(".gng-delete");
      await user.click(deleteIcon!);
      expect(actionFn).toHaveBeenCalled();
    });
  });
});
