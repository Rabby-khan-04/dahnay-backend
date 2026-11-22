import { Reflector } from "@nestjs/core";
export const SkipResponseWrapper = Reflector.createDecorator<void, boolean>({
  transform: () => true,
});
