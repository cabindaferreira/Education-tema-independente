import assert from "node:assert/strict";
import test from "node:test";
import {
  filterAvailableRoomSlots,
  filterRoomReservationsForStaff,
  hasRoomStaffAccess,
  roomStaffReservationResponse,
} from "../src/lib/rooms.ts";

test("only room staff, administrators, and the academy owner can manage reservations", () => {
  assert.equal(hasRoomStaffAccess({}), false);
  assert.equal(hasRoomStaffAccess({ academyRoles: ["student"] }), false);
  assert.equal(hasRoomStaffAccess({ academyRoles: ["room_staff"] }), true);
  assert.equal(hasRoomStaffAccess({ academyRoles: ["academy_admin"] }), true);
  assert.equal(hasRoomStaffAccess({ academyRole: "admin" }), true);
  assert.equal(hasRoomStaffAccess({ academyOwner: true }), true);
});

test("staff reservation results are scoped to the selected room and date", () => {
  const reservations = [
    { roomId: "sala-kudi", bookingDate: "2030-02-10", id: 1 },
    { roomId: "sala-soba", bookingDate: "2030-02-10", id: 2 },
    { roomId: "sala-kudi", bookingDate: "2030-02-11", id: 3 },
  ];

  assert.deepEqual(
    filterRoomReservationsForStaff(reservations, "sala-kudi", "2030-02-10").map(({ id }) => id),
    [1],
  );
});

test("staff responses omit the reservation NIF", () => {
  const reservation = {
    id: 9,
    roomId: "sala-kudi",
    bookingDate: "2030-02-10",
    startTime: "08:00:00",
    endTime: "09:00:00",
    durationMinutes: 60,
    priceKz: 3500,
    status: "confirmed",
    name: "Test Customer",
    company: null,
    cancelledByName: null,
    cancelledAt: null,
    nif: "DO-NOT-RETURN",
  };

  const response = roomStaffReservationResponse(reservation);
  assert.equal(response.roomId, "sala-kudi");
  assert.equal(response.date, "2030-02-10");
  assert.equal("nif" in response, false);
  assert.equal(JSON.stringify(response).includes(reservation.nif), false);
});

test("cancelled reservations no longer remove their slot from public availability", () => {
  const slot = { startTime: "08:00", endTime: "09:00" };
  const reservation = { startTime: "08:00:00", endTime: "09:00:00" };

  assert.deepEqual(
    filterAvailableRoomSlots([slot], [{ ...reservation, status: "confirmed" }]),
    [],
  );
  assert.deepEqual(
    filterAvailableRoomSlots([slot], [{ ...reservation, status: "cancelled" }]),
    [slot],
  );
});
