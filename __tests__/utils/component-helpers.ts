/**
 * Component Test Helpers
 * Utilities for common component testing patterns
 */
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { expect } from "vitest";

// Extend Vitest's expect with jest-axe matchers
expect.extend(toHaveNoViolations);

/**
 * Setup user event for interactions
 * Returns a user event instance with realistic timing
 */
export function setupUserEvent() {
  return userEvent.setup({
    // Add small delays to simulate real user behavior
    delay: 50,
  });
}

/**
 * Fill a form field by label
 */
export async function fillField(
  user: ReturnType<typeof userEvent.setup>,
  labelText: string | RegExp,
  value: string
): Promise<void> {
  const input = screen.getByLabelText(labelText);
  await user.clear(input);
  await user.type(input, value);
}

/**
 * Fill multiple form fields
 */
export async function fillForm(
  user: ReturnType<typeof userEvent.setup>,
  fields: Record<string, string>
): Promise<void> {
  for (const [label, value] of Object.entries(fields)) {
    await fillField(user, label, value);
  }
}

/**
 * Click a button by its text content
 */
export async function clickButton(
  user: ReturnType<typeof userEvent.setup>,
  buttonText: string | RegExp
): Promise<void> {
  const button = screen.getByRole("button", { name: buttonText });
  await user.click(button);
}

/**
 * Click a link by its text content
 */
export async function clickLink(
  user: ReturnType<typeof userEvent.setup>,
  linkText: string | RegExp
): Promise<void> {
  const link = screen.getByRole("link", { name: linkText });
  await user.click(link);
}

/**
 * Select an option from a select element
 */
export async function selectOption(
  user: ReturnType<typeof userEvent.setup>,
  labelText: string | RegExp,
  optionText: string
): Promise<void> {
  const select = screen.getByLabelText(labelText);
  await user.selectOptions(select, optionText);
}

/**
 * Toggle a checkbox
 */
export async function toggleCheckbox(
  user: ReturnType<typeof userEvent.setup>,
  labelText: string | RegExp
): Promise<void> {
  const checkbox = screen.getByLabelText(labelText);
  await user.click(checkbox);
}

/**
 * Submit a form
 */
export async function submitForm(
  user: ReturnType<typeof userEvent.setup>,
  submitButtonText: string | RegExp = /submit/i
): Promise<void> {
  await clickButton(user, submitButtonText);
}

/**
 * Wait for form to be submitted (useful when form has async validation)
 */
export async function waitForFormSubmission(
  submitMock: ReturnType<typeof vi.fn>,
  timeout: number = 3000
): Promise<void> {
  await waitFor(() => expect(submitMock).toHaveBeenCalled(), { timeout });
}

/**
 * Assert that an element is focused
 */
export function expectFocused(element: HTMLElement): void {
  expect(document.activeElement).toBe(element);
}

/**
 * Assert that form has error message
 */
export function expectFormError(errorText: string | RegExp): void {
  expect(screen.getByRole("alert")).toHaveTextContent(errorText);
}

/**
 * Assert that element has specific accessible name
 */
export function expectAccessibleName(element: HTMLElement, expectedName: string | RegExp): void {
  if (typeof expectedName === "string") {
    expect(element).toHaveAccessibleName(expectedName);
  } else {
    expect(element.getAttribute("aria-label")).toMatch(expectedName);
  }
}

/**
 * Run accessibility checks on container
 */
export async function checkAccessibility(container: HTMLElement): Promise<void> {
  const results = await axe(container);
  expect(results).toHaveNoViolations();
}

/**
 * Get all items in a list
 */
export function getListItems(listRole: string = "list"): HTMLElement[] {
  const list = screen.getByRole(listRole);
  return within(list).getAllByRole("listitem");
}

/**
 * Assert loading state is shown
 */
export function expectLoading(): void {
  expect(
    screen.queryByTestId("loader") ||
      screen.queryByTestId("spinner") ||
      screen.queryByRole("progressbar") ||
      screen.queryByText(/loading/i)
  ).toBeInTheDocument();
}

/**
 * Assert loading state is not shown
 */
export function expectNotLoading(): void {
  expect(screen.queryByTestId("loader")).not.toBeInTheDocument();
  expect(screen.queryByTestId("spinner")).not.toBeInTheDocument();
  expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
}

/**
 * Wait for loading to complete
 */
export async function waitForLoadingComplete(timeout: number = 5000): Promise<void> {
  await waitFor(
    () => {
      expectNotLoading();
    },
    { timeout }
  );
}

/**
 * Assert error message is displayed
 */
export function expectError(errorMessage: string | RegExp): void {
  const alert = screen.getByRole("alert");
  expect(alert).toHaveTextContent(errorMessage);
}

/**
 * Assert success message is displayed
 */
export function expectSuccess(successMessage: string | RegExp): void {
  expect(screen.getByText(successMessage)).toBeInTheDocument();
}

/**
 * Simulate pressing a keyboard key
 */
export async function pressKey(
  user: ReturnType<typeof userEvent.setup>,
  key: string
): Promise<void> {
  await user.keyboard(`{${key}}`);
}

/**
 * Simulate pressing Tab key
 */
export async function pressTab(
  user: ReturnType<typeof userEvent.setup>,
  shiftTab: boolean = false
): Promise<void> {
  if (shiftTab) {
    await user.keyboard("{Shift>}{Tab}{/Shift}");
  } else {
    await user.keyboard("{Tab}");
  }
}

/**
 * Simulate pressing Enter key
 */
export async function pressEnter(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await user.keyboard("{Enter}");
}

/**
 * Simulate pressing Escape key
 */
export async function pressEscape(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await user.keyboard("{Escape}");
}

/**
 * Check modal is open
 */
export function expectModalOpen(modalTitle?: string | RegExp): void {
  const dialog = screen.getByRole("dialog");
  expect(dialog).toBeInTheDocument();
  if (modalTitle) {
    expect(within(dialog).getByText(modalTitle)).toBeInTheDocument();
  }
}

/**
 * Check modal is closed
 */
export function expectModalClosed(): void {
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
}

/**
 * Hover over an element
 */
export async function hoverElement(
  user: ReturnType<typeof userEvent.setup>,
  element: HTMLElement
): Promise<void> {
  await user.hover(element);
}

/**
 * Unhover from an element
 */
export async function unhoverElement(
  user: ReturnType<typeof userEvent.setup>,
  element: HTMLElement
): Promise<void> {
  await user.unhover(element);
}

/**
 * Assert tooltip is visible
 */
export async function expectTooltip(
  user: ReturnType<typeof userEvent.setup>,
  triggerElement: HTMLElement,
  tooltipText: string | RegExp
): Promise<void> {
  await hoverElement(user, triggerElement);
  await waitFor(() => {
    expect(screen.getByRole("tooltip")).toHaveTextContent(tooltipText);
  });
}

/**
 * Get table rows
 */
export function getTableRows(): HTMLElement[] {
  return screen.getAllByRole("row").slice(1); // Skip header row
}

/**
 * Get table cell content
 */
export function getTableCell(row: HTMLElement, columnIndex: number): HTMLElement {
  const cells = within(row).getAllByRole("cell");
  return cells[columnIndex];
}
