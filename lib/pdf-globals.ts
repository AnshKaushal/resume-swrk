const EPSILON = 1e-10

type MatrixInit = number[] | string | DOMMatrixPolyfill

class DOMMatrixPolyfill {
  m11 = 1
  m12 = 0
  m13 = 0
  m14 = 0
  m21 = 0
  m22 = 1
  m23 = 0
  m24 = 0
  m31 = 0
  m32 = 0
  m33 = 1
  m34 = 0
  m41 = 0
  m42 = 0
  m43 = 0
  m44 = 1

  constructor(init?: MatrixInit) {
    if (init instanceof DOMMatrixPolyfill) {
      this.set3d([
        init.m11,
        init.m12,
        init.m13,
        init.m14,
        init.m21,
        init.m22,
        init.m23,
        init.m24,
        init.m31,
        init.m32,
        init.m33,
        init.m34,
        init.m41,
        init.m42,
        init.m43,
        init.m44,
      ])
    } else if (Array.isArray(init)) {
      if (init.length === 16) {
        this.set3d(init)
      } else if (init.length === 6) {
        this.set2d(init)
      }
    } else if (typeof init === "string") {
      this.parseString(init)
    }
  }

  private set2d(values: number[]) {
    ;[this.m11, this.m12, this.m21, this.m22, this.m41, this.m42] = values
    this.m13 = 0
    this.m14 = 0
    this.m23 = 0
    this.m24 = 0
    this.m31 = 0
    this.m32 = 0
    this.m33 = 1
    this.m34 = 0
    this.m43 = 0
    this.m44 = 1
  }

  private set3d(values: number[]) {
    ;[
      this.m11,
      this.m12,
      this.m13,
      this.m14,
      this.m21,
      this.m22,
      this.m23,
      this.m24,
      this.m31,
      this.m32,
      this.m33,
      this.m34,
      this.m41,
      this.m42,
      this.m43,
      this.m44,
    ] = values
  }

  private parseString(value: string) {
    const matrix2d = /^matrix\(\s*([^)]+)\)/.exec(value.trim())
    if (matrix2d) {
      const parts = matrix2d[1].split(",").map((n) => parseFloat(n.trim()))
      if (parts.length >= 6) this.set2d(parts.slice(0, 6))
      return
    }
    const matrix3d = /^matrix3d\(\s*([^)]+)\)/.exec(value.trim())
    if (matrix3d) {
      const parts = matrix3d[1].split(",").map((n) => parseFloat(n.trim()))
      if (parts.length >= 16) this.set3d(parts.slice(0, 16))
    }
  }

  get a() {
    return this.m11
  }
  set a(v: number) {
    this.m11 = v
  }
  get b() {
    return this.m12
  }
  set b(v: number) {
    this.m12 = v
  }
  get c() {
    return this.m21
  }
  set c(v: number) {
    this.m21 = v
  }
  get d() {
    return this.m22
  }
  set d(v: number) {
    this.m22 = v
  }
  get e() {
    return this.m41
  }
  set e(v: number) {
    this.m41 = v
  }
  get f() {
    return this.m42
  }
  set f(v: number) {
    this.m42 = v
  }

  get is2D() {
    return (
      this.m13 === 0 &&
      this.m14 === 0 &&
      this.m23 === 0 &&
      this.m24 === 0 &&
      this.m31 === 0 &&
      this.m32 === 0 &&
      this.m34 === 0 &&
      this.m43 === 0 &&
      this.m33 === 1 &&
      this.m44 === 1
    )
  }

  get isIdentity() {
    return (
      this.m11 === 1 &&
      this.m12 === 0 &&
      this.m13 === 0 &&
      this.m14 === 0 &&
      this.m21 === 0 &&
      this.m22 === 1 &&
      this.m23 === 0 &&
      this.m24 === 0 &&
      this.m31 === 0 &&
      this.m32 === 0 &&
      this.m33 === 1 &&
      this.m34 === 0 &&
      this.m41 === 0 &&
      this.m42 === 0 &&
      this.m43 === 0 &&
      this.m44 === 1
    )
  }

  toArray() {
    return [
      this.m11,
      this.m12,
      this.m13,
      this.m14,
      this.m21,
      this.m22,
      this.m23,
      this.m24,
      this.m31,
      this.m32,
      this.m33,
      this.m34,
      this.m41,
      this.m42,
      this.m43,
      this.m44,
    ]
  }

  toString() {
    if (this.is2D) {
      return `matrix(${this.m11}, ${this.m12}, ${this.m21}, ${this.m22}, ${this.m41}, ${this.m42})`
    }
    return `matrix3d(${this.toArray().join(", ")})`
  }

  private multiply2d(other: DOMMatrixPolyfill) {
    const a1 = this.m11
    const b1 = this.m12
    const c1 = this.m21
    const d1 = this.m22
    const e1 = this.m41
    const f1 = this.m42
    const a2 = other.m11
    const b2 = other.m12
    const c2 = other.m21
    const d2 = other.m22
    const e2 = other.m41
    const f2 = other.m42
    return [
      a1 * a2 + c1 * b2,
      b1 * a2 + d1 * b2,
      a1 * c2 + c1 * d2,
      b1 * c2 + d1 * d2,
      a1 * e2 + c1 * f2 + e1,
      b1 * e2 + d1 * f2 + f1,
    ]
  }

  multiply(other: DOMMatrixPolyfill) {
    const result = new DOMMatrixPolyfill(this)
    return result.multiplySelf(other)
  }

  multiplySelf(other: DOMMatrixPolyfill) {
    if (this.is2D && other.is2D) {
      this.set2d(this.multiply2d(other))
    } else {
      const a = this.toArray()
      const b = other.toArray()
      const out = new Array(16).fill(0)
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
          out[row * 4 + col] =
            a[row * 4] * b[col] +
            a[row * 4 + 1] * b[4 + col] +
            a[row * 4 + 2] * b[8 + col] +
            a[row * 4 + 3] * b[12 + col]
        }
      }
      this.set3d(out)
    }
    return this
  }

  preMultiplySelf(other: DOMMatrixPolyfill) {
    if (this.is2D && other.is2D) {
      const result = new DOMMatrixPolyfill(other)
      result.multiplySelf(this)
      this.set2d([
        result.m11,
        result.m12,
        result.m21,
        result.m22,
        result.m41,
        result.m42,
      ])
    } else {
      const result = new DOMMatrixPolyfill(other)
      result.multiplySelf(this)
      this.set3d(result.toArray())
    }
    return this
  }

  translate(tx: number, ty: number) {
    const result = new DOMMatrixPolyfill(this)
    return result.translateSelf(tx, ty)
  }

  translateSelf(tx: number, ty: number) {
    const a = this.m11
    const b = this.m12
    const c = this.m21
    const d = this.m22
    const e = this.m41
    const f = this.m42
    this.m41 = a * tx + c * ty + e
    this.m42 = b * tx + d * ty + f
    return this
  }

  scale(scaleX: number, scaleY: number) {
    const result = new DOMMatrixPolyfill(this)
    return result.scaleSelf(scaleX, scaleY)
  }

  scaleSelf(scaleX: number, scaleY: number) {
    const result = new DOMMatrixPolyfill([
      scaleX,
      0,
      0,
      scaleY,
      0,
      0,
    ])
    this.set2d(this.multiply2d(result))
    return this
  }

  rotate(rotZ: number) {
    const result = new DOMMatrixPolyfill(this)
    return result.rotateSelf(rotZ)
  }

  rotateSelf(rotZ: number) {
    const rad = (rotZ * Math.PI) / 180
    const cos = Math.cos(rad)
    const sin = Math.sin(rad)
    const result = new DOMMatrixPolyfill([cos, sin, -sin, cos, 0, 0])
    this.set2d(this.multiply2d(result))
    return this
  }

  invert() {
    const result = new DOMMatrixPolyfill(this)
    return result.invertSelf()
  }

  invertSelf() {
    const { m11, m12, m21, m22, m41, m42 } = this
    const det = m11 * m22 - m12 * m21
    if (Math.abs(det) < EPSILON) {
      return this
    }
    const inv = 1 / det
    const a = m22 * inv
    const b = -m12 * inv
    const c = -m21 * inv
    const d = m11 * inv
    const e = -(a * m41 + c * m42)
    const f = -(b * m41 + d * m42)
    this.set2d([a, b, c, d, e, f])
    return this
  }
}

if (typeof globalThis.DOMMatrix === "undefined") {
  Object.defineProperty(globalThis, "DOMMatrix", {
    value: DOMMatrixPolyfill,
    configurable: true,
    writable: true,
  })
}

export {}
