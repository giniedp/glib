import { DistanceFunc, euclideanDistance } from '../distance'
import { Sampler } from '../types'
import { floor } from '../utils'

// tslint:disable no-bitwise
// tslint:disable one-variable-per-declaration
const poissonCount: number[] = [
  4, 3, 1, 1, 1, 2, 4, 2, 2, 2, 5, 1, 0, 2, 1, 2,
  2, 0, 4, 3, 2, 1, 2, 1, 3, 2, 2, 4, 2, 2, 5, 1,
  2, 3, 2, 2, 2, 2, 2, 3, 2, 4, 2, 5, 3, 2, 2, 2,
  5, 3, 3, 5, 2, 1, 3, 3, 4, 4, 2, 3, 0, 4, 2, 2,
  2, 1, 3, 2, 2, 2, 3, 3, 3, 1, 2, 0, 2, 1, 1, 2,
  2, 2, 2, 5, 3, 2, 3, 2, 3, 2, 2, 1, 0, 2, 1, 1,
  2, 1, 2, 2, 1, 3, 4, 2, 2, 2, 5, 4, 2, 4, 2, 2,
  5, 4, 3, 2, 2, 5, 4, 3, 3, 3, 5, 2, 2, 2, 2, 2,
  3, 1, 1, 4, 2, 1, 3, 3, 4, 3, 2, 4, 3, 3, 3, 4,
  5, 1, 4, 2, 4, 3, 1, 2, 3, 5, 3, 2, 1, 3, 1, 3,
  3, 3, 2, 3, 1, 5, 5, 4, 2, 2, 4, 1, 3, 4, 1, 5,
  3, 3, 5, 3, 4, 3, 2, 2, 1, 1, 1, 1, 1, 2, 4, 5,
  4, 5, 4, 2, 1, 5, 1, 1, 2, 3, 3, 3, 2, 5, 2, 3,
  3, 2, 0, 2, 1, 1, 4, 2, 1, 3, 2, 1, 2, 2, 3, 2,
  5, 5, 3, 4, 5, 5, 2, 4, 4, 5, 3, 2, 2, 2, 1, 4,
  2, 3, 3, 4, 2, 5, 4, 2, 4, 2, 2, 2, 4, 5, 3, 2,
]

function AddSamples(ix: number, iy: number, iz: number, x: number, y: number, z: number, f: number[], distance: DistanceFunc) {

  ix = ix | 0
  iy = iy | 0
  iz = iz | 0

  const maxInt = 0x7fffffff
  let dx, dy, dz, fx, fy, fz, d2
  let count, i, j, index
  let seed // this_id

  // Each cube has a random number seed based on the cube's ID number.
  // The seed might be better if it were a nonlinear hash like Perlin uses
  // for noise but we do very well with this faster simple one.
  // Our LCG uses Knuth-approved constants for maximal periods.
  seed = ((702395077 * ix) | 0) + ((915488749 * iy) | 0) + ((2120969693 * iz) | 0)

  // How many feature points are in this cube?
  // 256 element lookup table. Use MSB
  count = poissonCount[(seed >> 24) & 0xff]

  // churn the seed with good Knuth LCG
  seed = (((1402024253 * seed) | 0) + 586950981) | 0

  // test and insert each point into our solution
  for (j = 0; j < count; j++) {
    // this_id = seed
    seed = (((1402024253 * seed) | 0) + 586950981) | 0 // churn

    // compute the 0..1 feature point location's XYZ
    fx = (seed & maxInt) / maxInt
    seed = (((1402024253 * seed) | 0) + 586950981) | 0 // churn

    fy = (seed & maxInt) / maxInt
    seed = (((1402024253 * seed) | 0) + 586950981) | 0 // churn

    fz = (seed & maxInt) / maxInt
    seed = (((1402024253 * seed) | 0) + 586950981) | 0 // churn

    // delta from feature point to sample location
    dx = ix + fx - x
    dy = iy + fy - y
    dz = iz + fz - z

    // Distance computation!  Lots of interesting variations are
    // possible here!
    // Biased "stretched"   A*dx*dx+B*dy*dy+C*dz*dz
    // Manhattan d2   fabs(dx)+fabs(dy)+fabs(dz)
    // Radial Manhattan:    A*fabs(dR)+B*fabs(dTheta)+C*dz
    // Superquadratic:      pow(fabs(dx), A) + pow(fabs(dy), B) + pow(fabs(dz),C)
    //
    // Go ahead and make your own! Remember that you must insure that
    // new d2 function causes large deltas in 3D space to map into
    // large deltas in your d2 function, so our 3D search can find
    // them! [Alternatively, change the search algorithm for your special
    // cases.]

    d2 = distance(dx, dy, dz)

    // Is this point close enough to rememember?
    if (d2 < f[f.length - 1]) {
      // Insert the information into the output arrays if it's close enough.
      // We use an insertion sort.  No need for a binary search to find
      // the appropriate index.. usually we're dealing with order 2,3,4 so
      // we can just go through the list. If you were computing order 50
      // (wow!!) you could get a speedup with a binary search in the sorted
      // F[] list.

      index = f.length
      while (index > 0 && d2 < f[index - 1]) {
        index--
      }

      // We insert this new point into slot # <index>

      // Bump down more distant information to make room for this new point.
      for (i = f.length - 1; i > index; i--) {
          f[i] = f[i - 1]
      }
      // Insert the new point's information into the list.
      f[index] = d2
    }
  }
}

function Worley2D(x: number, y: number, F: number[], d: DistanceFunc) {
  let x2, y2, mx2, my2
  let ix, iy
  let last = F.length - 1

  for (let i = 0; i < F.length; i++) {
    F[i] = Number.MAX_VALUE
  }

  // Find the integer cube holding the hit point
  ix = floor(x)
  iy = floor(y)

  AddSamples(ix, iy, 0, x, y, 0, F, d)

  x2 = x - ix
  y2 = y - iy
  mx2 = (1 - x2) * (1 - x2)
  my2 = (1 - y2) * (1 - y2)
  x2 *= x2
  y2 *= y2

  // Test 4 edges neighbors of center cube.
  if (x2 < F[last]) {
    AddSamples(ix - 1, iy, 0, x, y, 0, F, d)
  }
  if (y2 < F[last]) {
    AddSamples(ix, iy - 1, 0, x, y, 0, F, d)
  }
  if (mx2 < F[last]) {
    AddSamples(ix + 1, iy, 0, x, y, 0, F, d)
  }
  if (my2 < F[last]) {
    AddSamples(ix, iy + 1, 0, x, y, 0, F, d)
  }

  // Final 4 "corner" cubes
  if (x2 + y2 < F[last]) {
    AddSamples(ix - 1, iy - 1, 0, x, y, 0, F, d)
  }
  if (x2 + my2 < F[last]) {
    AddSamples(ix - 1, iy + 1, 0, x, y, 0, F, d)
  }
  if (mx2 + y2 < F[last]) {
    AddSamples(ix + 1, iy - 1, 0, x, y, 0, F, d)
  }
  if (mx2 + my2 < F[last]) {
    AddSamples(ix + 1, iy + 1, 0, x, y, 0, F, d)
  }

  // We're done! Convert everything to right size scale
  for (let i = 0; i < F.length; i++) {
    F[i] = Math.sqrt(F[i])
  }
}

function Worley3D(x: number, y: number, z: number, F: number[], distance: DistanceFunc) {
    let x2, y2, z2, mx2, my2, mz2
    let ix, iy, iz
    let last = F.length - 1

    // Initialize the F values to "huge" so they will be replaced by the
    // first real sample tests. Note we'll be storing and comparing the
    // SQUARED d2 from the feature points to avoid lots of slow
    // sqrt() calls. We'll use sqrt() only on the final answer.
    for (let i = 0; i < F.length; i++) {
      F[i] = Number.MAX_VALUE
    }

    // Find the integer cube holding the hit point
    ix = floor(x)
    iy = floor(y)
    iz = floor(z)

    // A simple way to compute the closest neighbors would be to test all
    // boundary cubes exhaustively. This is simple with code like:

    // int ii, jj, kk;
    // for (ii = -1; ii <= 1; ii++)
    //     for (jj = -1; jj <= 1; jj++)
    //         for (kk = -1; kk <= 1; kk++)
  //             AddSamples(ix + ii, iy + jj, iz + kk, x, y, z, F, distance);

    // for (int interpolation = 0; interpolation < F.length; interpolation++)
    // {
    //     F[interpolation] = (float)Math.Sqrt(F[interpolation]);
    // }
    // return;

    // But this wastes a lot of time working on cubes which are known to be
    // too far away to matter! So we can use a more complex testing method
    // that avoids this needless testing of distant cubes. This doubles the
    // speed of the algorithm.

    // Test the central cube for closest point(s).
    AddSamples(ix, iy, iz, x, y, z, F, distance)

    // We test if neighbor cubes are even POSSIBLE contributors by examining the
    // combinations of the sum of the squared distances from the cube's lower
    // or upper corners.
    x2 = x - ix
    y2 = y - iy
    z2 = z - iz
    mx2 = (1 - x2) * (1 - x2)
    my2 = (1 - y2) * (1 - y2)
    mz2 = (1 - z2) * (1 - z2)
    x2 *= x2
    y2 *= y2
    z2 *= z2

    // Test 6 facing neighbors of center cube. These are closest and most
    // likely to have a close feature point.
    if (x2 < F[last]) {
      AddSamples(ix - 1, iy, iz, x, y, z, F, distance)
    }
    if (y2 < F[last]) {
      AddSamples(ix, iy - 1, iz, x, y, z, F, distance)
    }
    if (z2 < F[last]) {
      AddSamples(ix, iy, iz - 1, x, y, z, F, distance)
    }

    if (mx2 < F[last]) {
      AddSamples(ix + 1, iy, iz, x, y, z, F, distance)
    }
    if (my2 < F[last]) {
      AddSamples(ix, iy + 1, iz, x, y, z, F, distance)
    }
    if (mz2 < F[last]) {
      AddSamples(ix, iy, iz + 1, x, y, z, F, distance)
    }

    /* Test 12 "edge cube" neighbors if necessary. They're next closest. */
    if (x2 + y2 < F[last]) {
      AddSamples(ix - 1, iy - 1, iz, x, y, z, F, distance)
    }
    if (x2 + z2 < F[last]) {
      AddSamples(ix - 1, iy, iz - 1, x, y, z, F, distance)
    }
    if (y2 + z2 < F[last]) {
      AddSamples(ix, iy - 1, iz - 1, x, y, z, F, distance)
    }
    if (mx2 + my2 < F[last]) {
      AddSamples(ix + 1, iy + 1, iz, x, y, z, F, distance)
    }
    if (mx2 + mz2 < F[last]) {
      AddSamples(ix + 1, iy, iz + 1, x, y, z, F, distance)
    }
    if (my2 + mz2 < F[last]) {
      AddSamples(ix, iy + 1, iz + 1, x, y, z, F, distance)
    }
    if (x2 + my2 < F[last]) {
      AddSamples(ix - 1, iy + 1, iz, x, y, z, F, distance)
    }
    if (x2 + mz2 < F[last]) {
      AddSamples(ix - 1, iy, iz + 1, x, y, z, F, distance)
    }
    if (y2 + mz2 < F[last]) {
      AddSamples(ix, iy - 1, iz + 1, x, y, z, F, distance)
    }
    if (mx2 + y2 < F[last]) {
      AddSamples(ix + 1, iy - 1, iz, x, y, z, F, distance)
    }
    if (mx2 + z2 < F[last]) {
      AddSamples(ix + 1, iy, iz - 1, x, y, z, F, distance)
    }
    if (my2 + z2 < F[last]) {
      AddSamples(ix, iy + 1, iz - 1, x, y, z, F, distance)
    }

    /* Final 8 "corner" cubes */
    if (x2 + y2 + z2 < F[last]) {
      AddSamples(ix - 1, iy - 1, iz - 1, x, y, z, F, distance)
    }
    if (x2 + y2 + mz2 < F[last]) {
      AddSamples(ix - 1, iy - 1, iz + 1, x, y, z, F, distance)
    }
    if (x2 + my2 + z2 < F[last]) {
      AddSamples(ix - 1, iy + 1, iz - 1, x, y, z, F, distance)
    }
    if (x2 + my2 + mz2 < F[last]) {
      AddSamples(ix - 1, iy + 1, iz + 1, x, y, z, F, distance)
    }
    if (mx2 + y2 + z2 < F[last]) {
      AddSamples(ix + 1, iy - 1, iz - 1, x, y, z, F, distance)
    }
    if (mx2 + y2 + mz2 < F[last]) {
      AddSamples(ix + 1, iy - 1, iz + 1, x, y, z, F, distance)
    }
    if (mx2 + my2 + z2 < F[last]) {
      AddSamples(ix + 1, iy + 1, iz - 1, x, y, z, F, distance)
    }
    if (mx2 + my2 + mz2 < F[last]) {
      AddSamples(ix + 1, iy + 1, iz + 1, x, y, z, F, distance)
    }

    // We're done! Convert everything to right size scale
    for (let i = 0; i < F.length; i++) {
      F[i] = Math.sqrt(F[i])
    }

    return
}

export function cellNoise(distance: DistanceFunc = euclideanDistance): Sampler {

  return (...x: number[]) => {
    if (x.length === 1) {
      const d = [0, 0, 0]
      Worley2D(x[0], 0, d, distance)
      return d[0]
    }
    if (x.length === 2) {
      const d = [0, 0, 0]
      Worley2D(x[0], x[1], d, distance)
      return d[1] - d[0]
    }
    if (x.length === 3) {
      const d = [0]
      Worley3D(x[0], x[1], x[2], d, distance)
      return d[0]
    }
  }
}
