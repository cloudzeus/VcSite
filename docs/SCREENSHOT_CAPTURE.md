# Screenshot Capture Feature

## Setup Instructions

To enable the screenshot capture feature for press items, you need to sign up for a screenshot API service and add the API key to your environment variables.

### Recommended Service: ScreenshotOne

1. **Sign up for ScreenshotOne**: https://screenshotone.com/
   - Free tier: 100 screenshots/month
   - Paid plans available for more usage

2. **Get your API keys**:
   - After signing up, go to your dashboard
   - Copy your **Access Key** and **Secret Key**

3. **Add to `.env` file**:
   ```env
   SCREENSHOT_ACCESS_KEY=your_access_key_here
   SCREENSHOT_SECRET_KEY=your_secret_key_here
   ```

### Alternative Services

If you prefer a different service, you can modify `/src/app/actions/screenshot.ts` to use:
- **ApiFlash**: https://apiflash.com/
- **ScreenshotAPI**: https://screenshotapi.net/
- **Urlbox**: https://urlbox.io/

## How to Use

1. Create or edit a press item
2. **Save the press item first** (screenshot capture only works on existing items)
3. Enter the external URL
4. Click the **camera icon** button next to the URL field
5. Wait for the screenshot to be captured (usually 5-10 seconds)
6. The screenshot will automatically be set as the default image for the press item

## Features

- Captures full-page screenshots at 1200x630px (optimal for social media)
- Blocks ads, cookie banners, and trackers for cleaner screenshots
- Automatically uploads to your Bunny CDN
- Sets the screenshot as the default image for the press item
- High-quality JPG format (80% quality)

## Troubleshooting

- **"Screenshot API keys not configured"**: Add both `SCREENSHOT_ACCESS_KEY` and `SCREENSHOT_SECRET_KEY` to your `.env` file
- **"Please save the press item first"**: You must save the press item before capturing a screenshot
- **"Failed to capture screenshot"**: Check that the URL is valid and accessible
