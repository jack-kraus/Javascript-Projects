export class Vector {
    constructor (x, y) {
        this.x = x;
        this.y = y;
    }

    add(other) {
        this.x += other.x;
        this.y += other.y;
    }

    sum(other) {
        return new Vector(this.x + other.x, this.y + other.y);
    }

    difference(other) {
        return new Vector(this.x - other.x, this.y - other.y);
    }

    minus_scalar(scalar) {
        const length = this.length();
        if (scalar > length) {
            this.scalar(0);
        }
        else {
            this.scalar((length-scalar)/length);
        };
    }

    clamp_length(length) {
        const current_length = Math.sqrt(this.x ** 2 + this.y ** 2);
        if (current_length > length) {
            this.x *= (length / current_length);
            this.y *= (length / current_length);
        }
    }

    normalize() {
        const current_length = Math.sqrt(this.x ** 2 + this.y ** 2);
        this.x /= current_length;
        this.y /= current_length;
    }

    normal() {
        const current_length = Math.sqrt(this.x ** 2 + this.y ** 2);
        return new Vector(this.x / current_length, this.y / current_length);
    }

    scalar(amount) {
        this.x *= amount;
        this.y *= amount;
    }

    dot(other) {
        return this.x * other.x + this.y * other.y;
    }

    length() {
        return Math.sqrt(this.x ** 2 + this.y ** 2);
    }

    reflect(other) {
        const nother = other.normal();
        const dot = this.dot(nother);

        this.x -= 2 * dot * nother.x;
        this.y -= 2 * dot * nother.y;
    }

    perpendicular() {
        const out = new Vector(-this.y, this.x);
        out.normalize();
        return out;
    }

    copy() {
        return new Vector(this.x, this.y);
    }

    angle() {
        return Math.atan2(this.y, this.x) * 180 / Math.PI;
    }
}

// check if two line segments AB and CD intersect
export function intersect(A,B,C,D) {
    const ccw = (IA, IB, IC) => (IC.y-IA.y) * (IB.x-IA.x) > (IB.y-IA.y) * (IC.x-IA.x);
    return ccw(A,C,D) != ccw(B,C,D) && ccw(A,B,C) != ccw(A,B,D);
}