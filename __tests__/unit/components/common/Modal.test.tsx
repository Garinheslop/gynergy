/**
 * Modal Component Tests
 * Tests for rendering and interaction behavior
 */
import React from "react";

import Modal from "@components/modal";
import { render, screen, userEvent, waitFor } from "@tests/utils/test-utils";
import { vi, describe, it, expect, beforeEach } from "vitest";

describe("Modal Component", () => {
  const defaultProps = {
    open: false,
    onClose: vi.fn(),
    children: <div data-testid="modal-content">Modal Content</div>,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    document.body.style.overflow = "";
  });

  describe("Rendering", () => {
    it("does not render when closed", () => {
      render(<Modal {...defaultProps} />);
      expect(screen.queryByTestId("modal-content")).not.toBeInTheDocument();
    });

    it("renders content when open", async () => {
      render(<Modal {...defaultProps} open={true} />);
      await waitFor(() => {
        expect(screen.getByTestId("modal-content")).toBeInTheDocument();
      });
    });

    it("renders children inside modal", async () => {
      render(
        <Modal {...defaultProps} open={true}>
          <div>Custom Content</div>
          <button>Action Button</button>
        </Modal>
      );
      await waitFor(() => {
        expect(screen.getByText("Custom Content")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Action Button" })).toBeInTheDocument();
      });
    });
  });

  describe("Body Scroll Lock", () => {
    it("prevents body scroll when open", async () => {
      render(<Modal {...defaultProps} open={true} />);
      await waitFor(() => {
        expect(document.body.style.overflow).toBe("hidden");
      });
    });

    it("restores body scroll when closed", async () => {
      const { rerender } = render(<Modal {...defaultProps} open={true} />);
      await waitFor(() => {
        expect(document.body.style.overflow).toBe("hidden");
      });

      rerender(<Modal {...defaultProps} open={false} />);
      await waitFor(() => {
        expect(document.body.style.overflow).toBe("auto");
      });
    });
  });

  describe("Close Behavior", () => {
    it("calls onClose when backdrop is clicked", async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();
      render(<Modal {...defaultProps} open={true} onClose={onClose} />);

      await waitFor(() => {
        expect(screen.getByTestId("modal-content")).toBeInTheDocument();
      });

      // Click on the close-modal backdrop element
      const backdrop = document.getElementById("close-modal");
      if (backdrop) {
        await user.click(backdrop);
        expect(onClose).toHaveBeenCalled();
      }
    });
  });

  describe("Transition States", () => {
    it("renders modal container when open", async () => {
      const { container } = render(<Modal {...defaultProps} open={true} />);
      await waitFor(() => {
        const modalContainer = container.querySelector(".fixed");
        expect(modalContainer).toBeInTheDocument();
      });
    });
  });
});
