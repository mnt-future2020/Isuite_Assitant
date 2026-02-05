export async function GET() {
  // Return an HTML page that closes itself
  return new Response(
    `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Connection Complete</title>
      </head>
      <body>
        <p>Connection successful! Closing...</p>
        <script>
          // Close the popup window after a short delay
          setTimeout(() => {
            window.close();
          }, 500);
        </script>
      </body>
    </html>
    `,
    {
      headers: {
        'Content-Type': 'text/html',
      },
    }
  );
}
