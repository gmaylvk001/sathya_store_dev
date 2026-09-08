import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import FestivalEffect from "@/models/FestivalEffect";

/**
 * GET
 * ?active=true -> Returns currently active festival effect
 * Without query -> Returns all configurations
 */
export async function GET(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active") === "true";

    if (activeOnly) {
      const now = new Date();

      const activeEffect = await FestivalEffect.findOne({
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now },
      })
        .sort({ startDate: -1 })
        .lean();

      return NextResponse.json({
        success: true,
        data: activeEffect || null,
      });
    }

    const effects = await FestivalEffect.find({})
      .sort({ startDate: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: effects,
    });
  } catch (error) {
    console.error("Festival effects GET error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch festival effects",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Create festival effect
 */
export async function POST(request) {
  try {
    await dbConnect();

    const body = await request.json();
    const { festival, effect, startDate, endDate, isActive = true } = body;

    if (!festival || !effect || !startDate || !endDate) {
      return NextResponse.json(
        {
          success: false,
          message: "Festival, effect, start date and end date are required.",
        },
        { status: 400 }
      );
    }

    if (!["fireworks", "snowfall"].includes(effect)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid effect type. Must be 'fireworks' or 'snowfall'.",
        },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid date/time.",
        },
        { status: 400 }
      );
    }

    if (start >= end) {
      return NextResponse.json(
        {
          success: false,
          message: "End date/time must be after start date/time.",
        },
        { status: 400 }
      );
    }

    const created = await FestivalEffect.create({
      festival: festival.trim(),
      effect,
      startDate: start,
      endDate: end,
      isActive: Boolean(isActive),
    });

    return NextResponse.json(
      {
        success: true,
        message: "Festival effect created successfully.",
        data: created,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Festival effects POST error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create festival effect.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * PUT - Update festival effect
 */
export async function PUT(request) {
  try {
    await dbConnect();

    const body = await request.json();
    const { id, festival, effect, startDate, endDate, isActive } = body;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Festival effect ID is required.",
        },
        { status: 400 }
      );
    }

    if (!festival || !effect || !startDate || !endDate) {
      return NextResponse.json(
        {
          success: false,
          message: "All required fields must be provided.",
        },
        { status: 400 }
      );
    }

    if (!["fireworks", "snowfall"].includes(effect)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid effect type.",
        },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid date/time.",
        },
        { status: 400 }
      );
    }

    if (start >= end) {
      return NextResponse.json(
        {
          success: false,
          message: "End date/time must be after start date/time.",
        },
        { status: 400 }
      );
    }

    const updated = await FestivalEffect.findByIdAndUpdate(
      id,
      {
        festival: festival.trim(),
        effect,
        startDate: start,
        endDate: end,
        isActive: Boolean(isActive),
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updated) {
      return NextResponse.json(
        {
          success: false,
          message: "Festival effect not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Festival effect updated successfully.",
      data: updated,
    });
  } catch (error) {
    console.error("Festival effects PUT error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update festival effect.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete festival effect
 */
export async function DELETE(request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    let id = searchParams.get("id");

    if (!id) {
      try {
        const body = await request.json();
        id = body?.id;
      } catch (e) {}
    }

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Festival effect ID is required.",
        },
        { status: 400 }
      );
    }

    const deleted = await FestivalEffect.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json(
        {
          success: false,
          message: "Festival effect not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Festival effect deleted successfully.",
    });
  } catch (error) {
    console.error("Festival effects DELETE error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to delete festival effect.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
