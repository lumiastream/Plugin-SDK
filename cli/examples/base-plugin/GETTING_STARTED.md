# Getting Started with Showcase Plugin Template

Welcome to your new Lumia Stream plugin! This guide will help you understand the plugin structure and start building your custom functionality.

## Project Structure

```
your-plugin/
├── manifest.json    # Plugin metadata and configuration
├── main.js          # Your plugin's main code
├── package.json     # npm dependencies (optional)
└── README.md        # Plugin documentation
```

## Understanding the Files

### 📋 manifest.json

This file defines your plugin's metadata and capabilities:

- **id**: Unique identifier using letters, numbers, or underscores (e.g., "my_awesome_plugin")
- **name**: Display name shown to users
- **description**: Short description for the plugin marketplace
- **main**: Entry point file (usually "main.js")
- **externalHelpLink**: This will be the link that shows on the auth page on bottom right when the user need help
- **config**: Defines settings, actions, and variables

**Key sections:**

- `settings`: User-configurable options for your plugin
- `settings_tutorial`: Markdown format tutorial on how to use the plugin, it is rendered on the right side of the plugin auth page
- `actions`: Functions users can trigger (e.g., send a message, change color)
- `variables`: Data your plugin exposes to Lumia Stream

### 🔧 main.js

Your plugin's logic lives here. The main class extends the `Plugin` base class:

```javascript
class YourPlugin extends Plugin {
  constructor(props) {
    super(props);
    // Initialize your plugin
  }

  async onload() {
    // Called when plugin is loaded
  }

  async onsettingsupdate() {
    // Called when settings change
  }

  async onunload() {
    // Called when plugin is unloaded
  }
}
```

## Common Tasks

### Adding a New Setting

1. Edit `manifest.json` in the `config.settings` array:

```json
{
  "key": "myNewSetting",
  "label": "My New Setting",
  "type": "text",
  "defaultValue": "default value",
  "required": false
}
```

2. Access in `main.js`:

```javascript
const value = this.getSetting("myNewSetting");
```

### Adding a New Action

1. Define in `manifest.json` under `config.actions`:

```json
{
  "type": "my_custom_action",
  "label": "Do Something Cool",
  "fields": [
    {
      "key": "message",
      "label": "Message",
      "type": "text",
      "required": true
    }
  ]
}
```

2. Handle in `main.js`:

```javascript
async onAction(action) {
  if (action.type === 'my_custom_action') {
    const message = action.fields.message;
    // Your logic here
  }
}
```

### Creating Variables

Variables let other Lumia features access your plugin's data:

1. Define in `manifest.json` under `config.variables`:

```json
{
  "name": "my_variable",
  "key": "myVariable",
  "origin": "your_plugin_id",
  "type": "string",
  "example": "Sample value"
}
```

2. Update in `main.js`:

```javascript
this.setVariable("myVariable", "new value");
```

## Testing Your Plugin

1. **Install dependencies** (if using package.json):

   ```bash
   npm install
   ```

2. **Load in Lumia Stream**:

   - Open Lumia Stream
   - Go to Plugins section
   - Load your plugin directory
   - Enable your plugin

3. **Check logs**:
   ```javascript
   this.log("Debug message");
   this.error("Error message");
   ```

## Next Steps

- [ ] Customize `manifest.json` with your plugin details
- [ ] Update the plugin name and description
- [ ] Add your custom settings
- [ ] Implement your actions
- [ ] Test your plugin in Lumia Stream
- [ ] Write tests (optional)
- [ ] Update README.md with usage instructions

## API Reference

### Plugin Methods

- `this.getSetting(key)` - Get a setting value
- `this.setVariable(key, value)` - Update a variable
- `this.log(message)` - Log info message
- `this.error(message)` - Log error message
- `this.sendAlert(type, data)` - Trigger an alert

### Lifecycle Hooks

- `onload()` - Plugin initialization
- `onunload()` - Cleanup when plugin is disabled
- `onsettingsupdate()` - Respond to setting changes
- `onAction(action)` - Handle triggered actions

## Common Patterns

### Making HTTP Requests

```javascript
const response = await fetch("https://api.example.com/data");
const data = await response.json();
```

### Using Timers

```javascript
async onload() {
  this.interval = setInterval(() => {
    // Do something periodically
  }, 5000);
}

async onunload() {
  if (this.interval) {
    clearInterval(this.interval);
  }
}
```

### Error Handling

```javascript
try {
  // Your code
} catch (error) {
  this.error(`Something went wrong: ${error.message}`);
}
```

## Troubleshooting

**Plugin not loading?**

- Check manifest.json syntax (use a JSON validator)
- Ensure the `main` field points to the correct file
- Check Lumia Stream logs for errors

**Settings not showing?**

- Verify the `settings` array in manifest.json
- Ensure required fields are filled

**Actions not working?**

- Check the action type matches your handler
- Verify field keys match what you're accessing

## Resources

- [Lumia Stream Documentation](https://docs.lumiastream.com)
- [Plugin API Reference](https://docs.lumiastream.com/plugins/api)
- [Example Plugins](https://github.com/lumiastream/plugins)
- [Community Discord](https://discord.gg/lumiastream)

## Need Help?

- Join the Lumia Stream Discord community
- Check the documentation
- Review example plugins
- Ask questions in the developer channel

---

Happy coding! 🚀
