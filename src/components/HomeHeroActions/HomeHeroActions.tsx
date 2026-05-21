"use client";

import { ArrowRight } from "@gravity-ui/icons";
import { Button, Flex, Icon } from "@/components/GravityUI/GravityUI";

export function HomeHeroActions() {
  return (
    <Flex gap={3} wrap className="home-hero__actions">
      <Button view="action" size="l" href="/docs">
        Start building
        <Icon data={ArrowRight} size={16} />
      </Button>
      <Button view="outlined" size="l" href="https://gravity-ui.com/">
        Gravity UI
      </Button>
    </Flex>
  );
}
