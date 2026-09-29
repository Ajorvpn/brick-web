import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { GlassSurface } from "./glass_surface";
import { GlassCard } from "./glass_card";
import { BrickButton, BrickButtonLink } from "./brick_button";
import { StatusPill } from "./status_pill";
import { SectionHeading } from "./section_heading";

describe("GlassSurface", () => {
  it("applies the requested material level", () => {
    render(<GlassSurface level={3} data-testid="surface" />);
    const el = screen.getByTestId("surface");
    expect(el).toHaveClass("glass", "glass-3");
  });

  it("applies the glow variant", () => {
    render(<GlassSurface glow data-testid="surface" />);
    expect(screen.getByTestId("surface")).toHaveClass("glass-glow");
  });
});

describe("GlassCard", () => {
  it("renders children and tilt marker", () => {
    render(
      <GlassCard tilt data-testid="card">
        content
      </GlassCard>,
    );
    expect(screen.getByTestId("card")).toHaveAttribute("data-tilt");
    expect(screen.getByText("content")).toBeInTheDocument();
  });
});

describe("BrickButton", () => {
  it("renders primary button variant", () => {
    render(<BrickButton>Follow the build</BrickButton>);
    expect(screen.getByRole("button", { name: "Follow the build" })).toHaveClass(
      "bg-brick-500",
    );
  });

  it("renders secondary link variant with href", () => {
    render(
      <BrickButtonLink variant="secondary" href="#architecture">
        Explore
      </BrickButtonLink>,
    );
    expect(screen.getByRole("link", { name: "Explore" })).toHaveAttribute(
      "href",
      "#architecture",
    );
  });
});

describe("StatusPill", () => {
  it("renders label", () => {
    render(<StatusPill label="In active development" />);
    expect(screen.getByText("In active development")).toBeInTheDocument();
  });
});

describe("SectionHeading", () => {
  it("renders eyebrow, title and lede", () => {
    render(
      <SectionHeading
        eyebrow="Privacy first"
        title="A VPN built for people"
        lede="Honest engineering."
      />,
    );
    expect(screen.getByText("Privacy first")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "A VPN built for people" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Honest engineering.")).toBeInTheDocument();
  });
});
