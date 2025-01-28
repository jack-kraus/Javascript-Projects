// Represents a vector
export class Vector {
    constructor (x, y) {
        this.x = x;
        this.y = y;
    }

    // add another vector to this
    add(other) {
        this.x += other.x;
        this.y += other.y;
    }

    // get new vector of this vector added to another
    sum(other) {
        return new Vector(this.x + other.x, this.y + other.y);
    }

    // get new vector of this vector subtracted by another
    difference(other) {
        return new Vector(this.x - other.x, this.y - other.y);
    }

    // subtract a scalar amount from this vector
    // if the scalar is greater than the length, the vector is now 0 length not backward
    minus_scalar(scalar) {
        const length = this.length();
        if (scalar > length) {
            this.scalar(0);
        }
        else {
            this.scalar((length-scalar)/length);
        };
    }

    // if vector longer than "length", shorten to that length
    clamp_length(length) {
        const current_length = Math.sqrt(this.x ** 2 + this.y ** 2);
        if (current_length > length) {
            this.x *= (length / current_length);
            this.y *= (length / current_length);
        }
    }

    // make length equal to 1
    normalize() {
        const current_length = Math.sqrt(this.x ** 2 + this.y ** 2);
        this.x /= current_length;
        this.y /= current_length;
    }

    // get new vector of length 1 pointing in this vector's direction
    normal() {
        const current_length = Math.sqrt(this.x ** 2 + this.y ** 2);
        return new Vector(this.x / current_length, this.y / current_length);
    }

    // multiplay vector by scalar amount
    scalar(amount) {
        this.x *= amount;
        this.y *= amount;
    }

    // get dot product between this vector and another
    dot(other) {
        return this.x * other.x + this.y * other.y;
    }

    // get length of this vector
    length() {
        return Math.sqrt(this.x ** 2 + this.y ** 2);
    }

    // reflect vector across another ("bounce off" another vector)
    reflect(other) {
        const nother = other.normal();
        const dot = this.dot(nother);

        this.x -= 2 * dot * nother.x;
        this.y -= 2 * dot * nother.y;
    }

    // get new vector perpendicular to this one
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