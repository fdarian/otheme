#!/usr/bin/env node

import { coreReady } from '@otheme/core'

if (!coreReady) {
  console.error('core unavailable')
}
