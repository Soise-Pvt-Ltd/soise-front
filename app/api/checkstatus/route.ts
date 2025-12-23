import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/checkstatus
 * Checks for the existence of the 'accessToken' cookie to determine auth status.
 */
export async function GET(req: NextRequest) {
  const hasToken = req.cookies.has('accessToken');
  return NextResponse.json({ isLoggedIn: hasToken });
}

/**
 * DELETE /api/checkstatus
 * Clears the 'accessToken' cookie to log the user out.
 */
export async function DELETE(req: NextRequest) {
  const response = NextResponse.json({ success: true, message: 'Logged out' });
  response.cookies.delete('accessToken');
  return response;
}
