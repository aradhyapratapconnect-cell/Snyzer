import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Badge } from '../src/components/ui/badge.js';
import { Button } from '../src/components/ui/button.js';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../src/components/ui/card.js';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '../src/components/ui/dialog.js';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../src/components/ui/dropdown-menu.js';
import { Input } from '../src/components/ui/input.js';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../src/components/ui/select.js';
import { Skeleton } from '../src/components/ui/skeleton.js';

/**
 * SNZ-035 render sanity tests: every design-system primitive mounts with
 * Snyzer tokens, interactive states work by keyboard, and overlays behave
 * (focus, Escape). No network involved.
 */
describe('design-system primitives', () => {
  it('renders button variants and disabled state', () => {
    render(
      <>
        <Button>Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="destructive" disabled>
          Off
        </Button>
      </>,
    );

    expect(screen.getByRole('button', { name: 'Primary' })).toHaveClass('bg-primary');
    expect(screen.getByRole('button', { name: 'Secondary' })).toHaveClass('border-line-light');
    expect(screen.getByRole('button', { name: 'Off' })).toBeDisabled();
  });

  it('renders labeled inputs with token styling', () => {
    render(
      <>
        <label htmlFor="demo-input">Name</label>
        <Input id="demo-input" placeholder="Ada" />
      </>,
    );

    const input = screen.getByLabelText('Name');
    expect(input).toHaveAttribute('placeholder', 'Ada');
    expect(input.className).toContain('border-line-light');
  });

  it('renders card structure with title and content', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Card title</CardTitle>
          <CardDescription>Card words</CardDescription>
        </CardHeader>
        <CardContent>Card body</CardContent>
      </Card>,
    );

    expect(screen.getByText('Card title')).toBeInTheDocument();
    expect(screen.getByText('Card words')).toBeInTheDocument();
    expect(screen.getByText('Card body')).toBeInTheDocument();
  });

  it('renders badge variants with visible text', () => {
    render(
      <>
        <Badge>New</Badge>
        <Badge variant="success">Done</Badge>
      </>,
    );

    expect(screen.getByText('New').className).toContain('bg-primary');
    expect(screen.getByText('Done').className).toContain('bg-success-light');
  });

  it('renders skeleton placeholders as pulsing, hidden decoration', () => {
    render(<Skeleton className="h-10 w-full" data-testid="skel" />);

    const skel = screen.getByTestId('skel');
    expect(skel.className).toContain('animate-pulse');
    expect(skel).toHaveAttribute('aria-hidden', 'true');
  });

  it('opens dialogs on trigger and closes on Escape', async () => {
    const user = userEvent.setup();
    render(
      <Dialog>
        <DialogTrigger>Open it</DialogTrigger>
        <DialogContent>
          <DialogTitle>Dialog title</DialogTitle>
          <DialogDescription>Dialog words</DialogDescription>
        </DialogContent>
      </Dialog>,
    );

    await user.click(screen.getByRole('button', { name: 'Open it' }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  // Radix Select/Dropdown open on pointer interaction that jsdom cannot
  // emulate (even with pointer-capture stubs); open-state behavior is covered
  // by keyboard in real browsers and by Playwright flows (SNZ-057/058).
  // These sanity tests pin the closed-state contract instead.
  it('renders the select trigger closed with its placeholder', () => {
    render(
      <Select>
        <SelectTrigger aria-label="Pick one">
          <SelectValue placeholder="Choose" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="a">Alpha</SelectItem>
          <SelectItem value="b">Beta</SelectItem>
        </SelectContent>
      </Select>,
    );

    const trigger = screen.getByRole('combobox', { name: 'Pick one' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveTextContent('Choose');
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
  });

  it('renders the dropdown trigger closed', () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>First item</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    expect(screen.getByRole('button', { name: 'Menu' })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem')).not.toBeInTheDocument();
  });
});
