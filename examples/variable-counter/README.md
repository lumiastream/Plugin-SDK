# Variable Counter Plugin (Example)

Illustrates how to read settings, store state in Lumia Stream variables, and respond to multiple actions.

## Behaviour

- On load, initialises the `variable-counter_count` variable with the configured starting value.
- **increment** action – increases the counter by the provided amount (default 1).
- **reset** action – restores the counter to the saved starting value.

Track the variable inside overlays or automations by referencing `variable-counter_count`.

MIT License
