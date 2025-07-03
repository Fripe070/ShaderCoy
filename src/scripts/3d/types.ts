export class Vec2 {
    x: number;
    y: number;
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
    toArray(): number[] {
        return [this.x, this.y];
    }

    length(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    normalized(): Vec2 {
        const len = this.length();
        return new Vec2(this.x / len, this.y / len);
    }
    add(other: Vec2 | number): Vec2 {
        if (typeof other === "number") return new Vec2(this.x + other, this.y + other);
        else return new Vec2(this.x + other.x, this.y + other.y);
    }
    sub(other: Vec2 | number): Vec2 {
        if (typeof other === "number") return new Vec2(this.x - other, this.y - other);
        else return new Vec2(this.x - other.x, this.y - other.y);
    }
    scale(scalar: number): Vec2 {
        return new Vec2(this.x * scalar, this.y * scalar);
    }
}

export class Vec3 {
    x: number;
    y: number;
    z: number;
    constructor(x: number, y: number, z: number) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    toArray(): number[] {
        return [this.x, this.y, this.z];
    }
    length(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }
    normalized(): Vec3 {
        const len = this.length();
        return new Vec3(this.x / len, this.y / len, this.z / len);
    }
    add(other: Vec3 | number): Vec3 {
        if (typeof other === "number")
            return new Vec3(this.x + other, this.y + other, this.z + other);
        else return new Vec3(this.x + other.x, this.y + other.y, this.z + other.z);
    }
    sub(other: Vec3 | number): Vec3 {
        if (typeof other === "number")
            return new Vec3(this.x - other, this.y - other, this.z - other);
        else return new Vec3(this.x - other.x, this.y - other.y, this.z - other.z);
    }
    scale(scalar: number): Vec3 {
        return new Vec3(this.x * scalar, this.y * scalar, this.z * scalar);
    }
}

export class Vec4 {
    x: number;
    y: number;
    z: number;
    w: number;
    constructor(x: number, y: number, z: number, w: number) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
    }
    toArray(): number[] {
        return [this.x, this.y, this.z, this.w];
    }
    length(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
    }
    normalized(): Vec4 {
        const len = this.length();
        return new Vec4(this.x / len, this.y / len, this.z / len, this.w / len);
    }
    add(other: Vec4 | number): Vec4 {
        if (typeof other === "number")
            return new Vec4(this.x + other, this.y + other, this.z + other, this.w + other);
        else
            return new Vec4(this.x + other.x, this.y + other.y, this.z + other.z, this.w + other.w);
    }
    sub(other: Vec4 | number): Vec4 {
        if (typeof other === "number")
            return new Vec4(this.x - other, this.y - other, this.z - other, this.w - other);
        else
            return new Vec4(this.x - other.x, this.y - other.y, this.z - other.z, this.w - other.w);
    }
    scale(scalar: number): Vec4 {
        return new Vec4(this.x * scalar, this.y * scalar, this.z * scalar, this.w * scalar);
    }
}
