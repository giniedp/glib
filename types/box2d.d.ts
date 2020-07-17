declare function Box2D<T>(target?: T): Promise<T & typeof Box2D>;
declare module Box2D {
    function destroy(obj: any): void;
    function _malloc(size: number): number;
    function _free(ptr: number): void;
    const HEAP8: Int8Array;
    const HEAP16: Int16Array;
    const HEAP32: Int32Array;
    const HEAPU8: Uint8Array;
    const HEAPU16: Uint16Array;
    const HEAPU32: Uint32Array;
    const HEAPF32: Float32Array;
    const HEAPF64: Float64Array;
    class b2Contact {
        GetManifold(): b2Manifold;
        GetWorldManifold(manifold: b2WorldManifold): void;
        IsTouching(): boolean;
        SetEnabled(flag: boolean): void;
        IsEnabled(): boolean;
        GetNext(): b2Contact;
        GetFixtureA(): b2Fixture;
        GetChildIndexA(): number;
        GetFixtureB(): b2Fixture;
        GetChildIndexB(): number;
        SetFriction(friction: number): void;
        GetFriction(): number;
        ResetFriction(): void;
        SetRestitution(restitution: number): void;
        GetRestitution(): number;
        ResetRestitution(): void;
        SetTangentSpeed(speed: number): void;
        GetTangentSpeed(): number;
    }
    class b2ContactListener {
    }
    class JSContactListener {
        constructor();
        BeginContact(contact: b2Contact): void;
        EndContact(contact: b2Contact): void;
        PreSolve(contact: b2Contact, oldManifold: b2Manifold): void;
        PostSolve(contact: b2Contact, impulse: b2ContactImpulse): void;
    }
    class b2World {
        constructor(gravity: b2Vec2);
        SetDestructionListener(listener: b2DestructionListener): void;
        SetContactFilter(filter: JSContactFilter): void;
        SetContactListener(listener: JSContactListener): void;
        SetDebugDraw(debugDraw: b2Draw): void;
        CreateBody(def: b2BodyDef): b2Body;
        DestroyBody(body: b2Body): void;
        CreateJoint(def: b2JointDef): b2Joint;
        DestroyJoint(joint: b2Joint): void;
        Step(timeStep: number, velocityIterations: number, positionIterations: number): void;
        ClearForces(): void;
        DrawDebugData(): void;
        QueryAABB(callback: b2QueryCallback, aabb: b2AABB): void;
        RayCast(callback: b2RayCastCallback, point1: b2Vec2, point2: b2Vec2): void;
        GetBodyList(): b2Body;
        GetJointList(): b2Joint;
        GetContactList(): b2Contact;
        SetAllowSleeping(flag: boolean): void;
        GetAllowSleeping(): boolean;
        SetWarmStarting(flag: boolean): void;
        GetWarmStarting(): boolean;
        SetContinuousPhysics(flag: boolean): void;
        GetContinuousPhysics(): boolean;
        SetSubStepping(flag: boolean): void;
        GetSubStepping(): boolean;
        GetProxyCount(): number;
        GetBodyCount(): number;
        GetJointCount(): number;
        GetContactCount(): number;
        GetTreeHeight(): number;
        GetTreeBalance(): number;
        GetTreeQuality(): number;
        SetGravity(gravity: b2Vec2): void;
        GetGravity(): b2Vec2;
        IsLocked(): boolean;
        SetAutoClearForces(flag: boolean): void;
        GetAutoClearForces(): boolean;
        GetProfile(): b2Profile;
        Dump(): void;
    }
    type b2ShapeType = "b2Shape::e_circle" | "b2Shape::e_edge" | "b2Shape::e_polygon" | "b2Shape::e_chain" | "b2Shape::e_typeCount";
    class b2Shape {
        GetType(): b2ShapeType;
        GetChildCount(): number;
        TestPoint(xf: b2Transform, p: b2Vec2): boolean;
        RayCast(output: b2RayCastOutput, input: b2RayCastInput, transform: b2Transform, childIndex: number): boolean;
        ComputeAABB(aabb: b2AABB, xf: b2Transform, childIndex: number): void;
        ComputeMass(massData: b2MassData, density: number): void;
        get_m_type(): b2ShapeType;
        set_m_type(m_type: b2ShapeType): void;
        get_m_radius(): number;
        set_m_radius(m_radius: number): void;
    }
    class b2FixtureDef {
        constructor();
        get_shape(): b2Shape;
        set_shape(shape: b2Shape): void;
        get_userData(): any;
        set_userData(userData: any): void;
        get_friction(): number;
        set_friction(friction: number): void;
        get_restitution(): number;
        set_restitution(restitution: number): void;
        get_density(): number;
        set_density(density: number): void;
        get_isSensor(): boolean;
        set_isSensor(isSensor: boolean): void;
        get_filter(): b2Filter;
        set_filter(filter: b2Filter): void;
    }
    class b2Fixture {
        GetType(): b2ShapeType;
        GetShape(): b2Shape;
        SetSensor(sensor: boolean): void;
        IsSensor(): boolean;
        SetFilterData(filter: b2Filter): void;
        GetFilterData(): b2Filter;
        Refilter(): void;
        GetBody(): b2Body;
        GetNext(): b2Fixture;
        GetUserData(): any;
        SetUserData(data: any): void;
        TestPoint(p: b2Vec2): boolean;
        RayCast(output: b2RayCastOutput, input: b2RayCastInput, childIndex: number): boolean;
        GetMassData(massData: b2MassData): void;
        SetDensity(density: number): void;
        GetDensity(): number;
        GetFriction(): number;
        SetFriction(friction: number): void;
        GetRestitution(): number;
        SetRestitution(restitution: number): void;
        GetAABB(childIndex: number): b2AABB;
        Dump(bodyIndex: number): void;
    }
    class b2Transform {
        constructor();
        constructor(position: b2Vec2, rotation: b2Rot);
        SetIdentity(): void;
        Set(position: b2Vec2, angle: number): void;
        get_p(): b2Vec2;
        set_p(p: b2Vec2): void;
        get_q(): b2Rot;
        set_q(q: b2Rot): void;
    }
    class b2RayCastCallback {
    }
    class JSRayCastCallback {
        constructor();
        ReportFixture(fixture: b2Fixture, point: b2Vec2, normal: b2Vec2, fraction: number): number;
    }
    class b2QueryCallback {
    }
    class JSQueryCallback {
        constructor();
        ReportFixture(fixture: b2Fixture): boolean;
    }
    class b2MassData {
        constructor();
        get_mass(): number;
        set_mass(mass: number): void;
        get_center(): b2Vec2;
        set_center(center: b2Vec2): void;
        get_I(): number;
        set_I(I: number): void;
    }
    class b2Vec2 {
        constructor();
        constructor(x: number, y: number);
        SetZero(): void;
        Set(x: number, y: number): void;
        op_add(v: b2Vec2): void;
        op_sub(v: b2Vec2): void;
        op_mul(s: number): void;
        Length(): number;
        LengthSquared(): number;
        Normalize(): number;
        IsValid(): boolean;
        Skew(): b2Vec2;
        get_x(): number;
        set_x(x: number): void;
        get_y(): number;
        set_y(y: number): void;
    }
    class b2Vec3 {
        constructor();
        constructor(x: number, y: number, z: number);
        SetZero(): void;
        Set(x: number, y: number, z: number): void;
        op_add(v: b2Vec3): void;
        op_sub(v: b2Vec3): void;
        op_mul(s: number): void;
        get_x(): number;
        set_x(x: number): void;
        get_y(): number;
        set_y(y: number): void;
        get_z(): number;
        set_z(z: number): void;
    }
    class b2Body {
        CreateFixture(def: b2FixtureDef): b2Fixture;
        CreateFixture(shape: b2Shape, density: number): b2Fixture;
        DestroyFixture(fixture: b2Fixture): void;
        SetTransform(position: b2Vec2, angle: number): void;
        GetTransform(): b2Transform;
        GetPosition(): b2Vec2;
        GetAngle(): number;
        GetWorldCenter(): b2Vec2;
        GetLocalCenter(): b2Vec2;
        SetLinearVelocity(v: b2Vec2): void;
        GetLinearVelocity(): b2Vec2;
        SetAngularVelocity(omega: number): void;
        GetAngularVelocity(): number;
        ApplyForce(force: b2Vec2, point: b2Vec2, awake: boolean): void;
        ApplyForceToCenter(force: b2Vec2, awake: boolean): void;
        ApplyTorque(torque: number, awake: boolean): void;
        ApplyLinearImpulse(impulse: b2Vec2, point: b2Vec2, awake: boolean): void;
        ApplyAngularImpulse(impulse: number, awake: boolean): void;
        GetMass(): number;
        GetInertia(): number;
        GetMassData(data: b2MassData): void;
        SetMassData(data: b2MassData): void;
        ResetMassData(): void;
        GetWorldPoint(localPoint: b2Vec2): b2Vec2;
        GetWorldVector(localVector: b2Vec2): b2Vec2;
        GetLocalPoint(worldPoint: b2Vec2): b2Vec2;
        GetLocalVector(worldVector: b2Vec2): b2Vec2;
        GetLinearVelocityFromWorldPoint(worldPoint: b2Vec2): b2Vec2;
        GetLinearVelocityFromLocalPoint(localPoint: b2Vec2): b2Vec2;
        GetLinearDamping(): number;
        SetLinearDamping(linearDamping: number): void;
        GetAngularDamping(): number;
        SetAngularDamping(angularDamping: number): void;
        GetGravityScale(): number;
        SetGravityScale(scale: number): void;
        SetType(type: b2BodyType): void;
        GetType(): b2BodyType;
        SetBullet(flag: boolean): void;
        IsBullet(): boolean;
        SetSleepingAllowed(flag: boolean): void;
        IsSleepingAllowed(): boolean;
        SetAwake(flag: boolean): void;
        IsAwake(): boolean;
        SetActive(flag: boolean): void;
        IsActive(): boolean;
        SetFixedRotation(flag: boolean): void;
        IsFixedRotation(): boolean;
        GetFixtureList(): b2Fixture;
        GetJointList(): b2JointEdge;
        GetContactList(): b2ContactEdge;
        GetNext(): b2Body;
        GetUserData(): any;
        SetUserData(data: any): void;
        GetWorld(): b2World;
        Dump(): void;
    }
    type b2BodyType = "b2_staticBody" | "b2_kinematicBody" | "b2_dynamicBody";
    class b2BodyDef {
        constructor();
        get_type(): b2BodyType;
        set_type(type: b2BodyType): void;
        get_position(): b2Vec2;
        set_position(position: b2Vec2): void;
        get_angle(): number;
        set_angle(angle: number): void;
        get_linearVelocity(): b2Vec2;
        set_linearVelocity(linearVelocity: b2Vec2): void;
        get_angularVelocity(): number;
        set_angularVelocity(angularVelocity: number): void;
        get_linearDamping(): number;
        set_linearDamping(linearDamping: number): void;
        get_angularDamping(): number;
        set_angularDamping(angularDamping: number): void;
        get_allowSleep(): boolean;
        set_allowSleep(allowSleep: boolean): void;
        get_awake(): boolean;
        set_awake(awake: boolean): void;
        get_fixedRotation(): boolean;
        set_fixedRotation(fixedRotation: boolean): void;
        get_bullet(): boolean;
        set_bullet(bullet: boolean): void;
        get_active(): boolean;
        set_active(active: boolean): void;
        get_userData(): any;
        set_userData(userData: any): void;
        get_gravityScale(): number;
        set_gravityScale(gravityScale: number): void;
    }
    class b2Filter {
        constructor();
        get_categoryBits(): number;
        set_categoryBits(categoryBits: number): void;
        get_maskBits(): number;
        set_maskBits(maskBits: number): void;
        get_groupIndex(): number;
        set_groupIndex(groupIndex: number): void;
    }
    class b2AABB {
        constructor();
        IsValid(): boolean;
        GetCenter(): b2Vec2;
        GetExtents(): b2Vec2;
        GetPerimeter(): number;
        Combine(aabb: b2AABB): void;
        Combine(aabb1: b2AABB, aabb2: b2AABB): void;
        Contains(aabb: b2AABB): boolean;
        RayCast(output: b2RayCastOutput, input: b2RayCastInput): boolean;
        get_lowerBound(): b2Vec2;
        set_lowerBound(lowerBound: b2Vec2): void;
        get_upperBound(): b2Vec2;
        set_upperBound(upperBound: b2Vec2): void;
    }
    class b2CircleShape extends b2Shape {
        constructor();
        get_m_p(): b2Vec2;
        set_m_p(m_p: b2Vec2): void;
    }
    class b2EdgeShape extends b2Shape {
        constructor();
        Set(v1: b2Vec2, v2: b2Vec2): void;
        get_m_vertex1(): b2Vec2;
        set_m_vertex1(m_vertex1: b2Vec2): void;
        get_m_vertex2(): b2Vec2;
        set_m_vertex2(m_vertex2: b2Vec2): void;
        get_m_vertex0(): b2Vec2;
        set_m_vertex0(m_vertex0: b2Vec2): void;
        get_m_vertex3(): b2Vec2;
        set_m_vertex3(m_vertex3: b2Vec2): void;
        get_m_hasVertex0(): boolean;
        set_m_hasVertex0(m_hasVertex0: boolean): void;
        get_m_hasVertex3(): boolean;
        set_m_hasVertex3(m_hasVertex3: boolean): void;
    }
    type b2JointType = "e_unknownJoint" | "e_revoluteJoint" | "e_prismaticJoint" | "e_distanceJoint" | "e_pulleyJoint" | "e_mouseJoint" | "e_gearJoint" | "e_wheelJoint" | "e_weldJoint" | "e_frictionJoint" | "e_ropeJoint" | "e_motorJoint";
    type b2LimitState = "e_inactiveLimit" | "e_atLowerLimit" | "e_atUpperLimit" | "e_equalLimits";
    class b2JointDef {
        constructor();
        get_type(): b2JointType;
        set_type(type: b2JointType): void;
        get_userData(): any;
        set_userData(userData: any): void;
        get_bodyA(): b2Body;
        set_bodyA(bodyA: b2Body): void;
        get_bodyB(): b2Body;
        set_bodyB(bodyB: b2Body): void;
        get_collideConnected(): boolean;
        set_collideConnected(collideConnected: boolean): void;
    }
    class b2Joint {
        GetType(): b2JointType;
        GetBodyA(): b2Body;
        GetBodyB(): b2Body;
        GetAnchorA(): b2Vec2;
        GetAnchorB(): b2Vec2;
        GetReactionForce(inv_dt: number): b2Vec2;
        GetReactionTorque(inv_dt: number): number;
        GetNext(): b2Joint;
        GetUserData(): any;
        SetUserData(data: any): void;
        IsActive(): boolean;
        GetCollideConnected(): boolean;
        Dump(): void;
    }
    class b2WeldJoint extends b2Joint {
        GetLocalAnchorA(): b2Vec2;
        GetLocalAnchorB(): b2Vec2;
        SetFrequency(hz: number): void;
        GetFrequency(): number;
        SetDampingRatio(ratio: number): void;
        GetDampingRatio(): number;
        Dump(): void;
    }
    class b2WeldJointDef extends b2JointDef {
        constructor();
        Initialize(bodyA: b2Body, bodyB: b2Body, anchor: b2Vec2): void;
        get_localAnchorA(): b2Vec2;
        set_localAnchorA(localAnchorA: b2Vec2): void;
        get_localAnchorB(): b2Vec2;
        set_localAnchorB(localAnchorB: b2Vec2): void;
        get_referenceAngle(): number;
        set_referenceAngle(referenceAngle: number): void;
        get_frequencyHz(): number;
        set_frequencyHz(frequencyHz: number): void;
        get_dampingRatio(): number;
        set_dampingRatio(dampingRatio: number): void;
    }
    class b2ChainShape extends b2Shape {
        constructor();
        Clear(): void;
        CreateLoop(vertices: b2Vec2, count: number): void;
        CreateChain(vertices: b2Vec2, count: number): void;
        SetPrevVertex(prevVertex: b2Vec2): void;
        SetNextVertex(nextVertex: b2Vec2): void;
        GetChildEdge(edge: b2EdgeShape, index: number): void;
        get_m_vertices(): b2Vec2;
        set_m_vertices(m_vertices: b2Vec2): void;
        get_m_count(): number;
        set_m_count(m_count: number): void;
        get_m_prevVertex(): b2Vec2;
        set_m_prevVertex(m_prevVertex: b2Vec2): void;
        get_m_nextVertex(): b2Vec2;
        set_m_nextVertex(m_nextVertex: b2Vec2): void;
        get_m_hasPrevVertex(): boolean;
        set_m_hasPrevVertex(m_hasPrevVertex: boolean): void;
        get_m_hasNextVertex(): boolean;
        set_m_hasNextVertex(m_hasNextVertex: boolean): void;
    }
    class b2Color {
        constructor();
        constructor(r: number, g: number, b: number);
        Set(ri: number, gi: number, bi: number): void;
        get_r(): number;
        set_r(r: number): void;
        get_g(): number;
        set_g(g: number): void;
        get_b(): number;
        set_b(b: number): void;
    }
    class b2ContactEdge {
        constructor();
        get_other(): b2Body;
        set_other(other: b2Body): void;
        get_contact(): b2Contact;
        set_contact(contact: b2Contact): void;
        get_prev(): b2ContactEdge;
        set_prev(prev: b2ContactEdge): void;
        get_next(): b2ContactEdge;
        set_next(next: b2ContactEdge): void;
    }
    type b2ContactFeatureType = "b2ContactFeature::e_vertex" | "b2ContactFeature::e_face";
    class b2ContactFeature {
        get_indexA(): number;
        set_indexA(indexA: number): void;
        get_indexB(): number;
        set_indexB(indexB: number): void;
        get_typeA(): number;
        set_typeA(typeA: number): void;
        get_typeB(): number;
        set_typeB(typeB: number): void;
    }
    class b2ContactFilter {
    }
    class JSContactFilter {
        constructor();
        ShouldCollide(fixtureA: b2Fixture, fixtureB: b2Fixture): boolean;
    }
    class b2ContactID {
        get_cf(): b2ContactFeature;
        set_cf(cf: b2ContactFeature): void;
        get_key(): number;
        set_key(key: number): void;
    }
    class b2ContactImpulse {
        get_count(): number;
        set_count(count: number): void;
    }
    class b2DestructionListener {
    }
    class b2DestructionListenerWrapper {
    }
    class JSDestructionListener {
        constructor();
        SayGoodbyeJoint(joint: b2Joint): void;
        SayGoodbyeFixture(joint: b2Fixture): void;
    }
    class b2DistanceJoint extends b2Joint {
        GetLocalAnchorA(): b2Vec2;
        GetLocalAnchorB(): b2Vec2;
        SetLength(length: number): void;
        GetLength(): number;
        SetFrequency(hz: number): void;
        GetFrequency(): number;
        SetDampingRatio(ratio: number): void;
        GetDampingRatio(): number;
    }
    class b2DistanceJointDef extends b2JointDef {
        constructor();
        Initialize(bodyA: b2Body, bodyB: b2Body, anchorA: b2Vec2, anchorB: b2Vec2): void;
        get_localAnchorA(): b2Vec2;
        set_localAnchorA(localAnchorA: b2Vec2): void;
        get_localAnchorB(): b2Vec2;
        set_localAnchorB(localAnchorB: b2Vec2): void;
        get_length(): number;
        set_length(length: number): void;
        get_frequencyHz(): number;
        set_frequencyHz(frequencyHz: number): void;
        get_dampingRatio(): number;
        set_dampingRatio(dampingRatio: number): void;
    }
    type b2DrawFlag = "b2Draw::e_shapeBit" | "b2Draw::e_jointBit" | "b2Draw::e_aabbBit" | "b2Draw::e_pairBit" | "b2Draw::e_centerOfMassBit";
    class b2Draw {
        SetFlags(flags: number): void;
        GetFlags(): number;
        AppendFlags(flags: number): void;
        ClearFlags(flags: number): void;
    }
    class JSDraw {
        constructor();
        DrawPolygon(vertices: b2Vec2, vertexCount: number, color: b2Color): void;
        DrawSolidPolygon(vertices: b2Vec2, vertexCount: number, color: b2Color): void;
        DrawCircle(center: b2Vec2, radius: number, color: b2Color): void;
        DrawSolidCircle(center: b2Vec2, radius: number, axis: b2Vec2, color: b2Color): void;
        DrawSegment(p1: b2Vec2, p2: b2Vec2, color: b2Color): void;
        DrawTransform(xf: b2Transform): void;
    }
    class b2FrictionJoint extends b2Joint {
        GetLocalAnchorA(): b2Vec2;
        GetLocalAnchorB(): b2Vec2;
        SetMaxForce(force: number): void;
        GetMaxForce(): number;
        SetMaxTorque(torque: number): void;
        GetMaxTorque(): number;
    }
    class b2FrictionJointDef extends b2JointDef {
        constructor();
        Initialize(bodyA: b2Body, bodyB: b2Body, anchor: b2Vec2): void;
        get_localAnchorA(): b2Vec2;
        set_localAnchorA(localAnchorA: b2Vec2): void;
        get_localAnchorB(): b2Vec2;
        set_localAnchorB(localAnchorB: b2Vec2): void;
        get_maxForce(): number;
        set_maxForce(maxForce: number): void;
        get_maxTorque(): number;
        set_maxTorque(maxTorque: number): void;
    }
    class b2GearJoint extends b2Joint {
        GetJoint1(): b2Joint;
        GetJoint2(): b2Joint;
        SetRatio(ratio: number): void;
        GetRatio(): number;
    }
    class b2GearJointDef extends b2JointDef {
        constructor();
        get_joint1(): b2Joint;
        set_joint1(joint1: b2Joint): void;
        get_joint2(): b2Joint;
        set_joint2(joint2: b2Joint): void;
        get_ratio(): number;
        set_ratio(ratio: number): void;
    }
    class b2JointEdge {
        constructor();
        get_other(): b2Body;
        set_other(other: b2Body): void;
        get_joint(): b2Joint;
        set_joint(joint: b2Joint): void;
        get_prev(): b2JointEdge;
        set_prev(prev: b2JointEdge): void;
        get_next(): b2JointEdge;
        set_next(next: b2JointEdge): void;
    }
    type b2ManifoldType = "b2Manifold::e_circles" | "b2Manifold::e_faceA" | "b2Manifold::e_faceB";
    class b2Manifold {
        constructor();
        get_localNormal(): b2Vec2;
        set_localNormal(localNormal: b2Vec2): void;
        get_localPoint(): b2Vec2;
        set_localPoint(localPoint: b2Vec2): void;
        get_type(): b2ManifoldType;
        set_type(type: b2ManifoldType): void;
        get_pointCount(): number;
        set_pointCount(pointCount: number): void;
    }
    class b2WorldManifold {
        constructor();
        Initialize(manifold: b2Manifold, xfA: b2Transform, radiusA: number, xfB: b2Transform, radiusB: number): void;
        get_normal(): b2Vec2;
        set_normal(normal: b2Vec2): void;
        get_points(): ReadonlyArray<b2Vec2>;
        set_points(points: ReadonlyArray<b2Vec2>): void;
        get_separations(): ReadonlyArray<number>;
        set_separations(separations: ReadonlyArray<number>): void;
    }
    class b2ManifoldPoint {
        constructor();
        get_localPoint(): b2Vec2;
        set_localPoint(localPoint: b2Vec2): void;
        get_normalImpulse(): number;
        set_normalImpulse(normalImpulse: number): void;
        get_tangentImpulse(): number;
        set_tangentImpulse(tangentImpulse: number): void;
        get_id(): b2ContactID;
        set_id(id: b2ContactID): void;
    }
    class b2Mat22 {
        constructor();
        constructor(c1: b2Vec2, c2: b2Vec2);
        constructor(a11: number, a12: number, a21: number, a22: number);
        Set(c1: b2Vec2, c2: b2Vec2): void;
        SetIdentity(): void;
        SetZero(): void;
        GetInverse(): b2Mat22;
        Solve(b: b2Vec2): b2Vec2;
        get_ex(): b2Vec2;
        set_ex(ex: b2Vec2): void;
        get_ey(): b2Vec2;
        set_ey(ey: b2Vec2): void;
    }
    class b2Mat33 {
        constructor();
        constructor(c1: b2Vec3, c2: b2Vec3, c3: b2Vec3);
        SetZero(): void;
        Solve33(b: b2Vec3): b2Vec3;
        Solve22(b: b2Vec2): b2Vec2;
        GetInverse22(M: b2Mat33): void;
        GetSymInverse33(M: b2Mat33): void;
        get_ex(): b2Vec3;
        set_ex(ex: b2Vec3): void;
        get_ey(): b2Vec3;
        set_ey(ey: b2Vec3): void;
        get_ez(): b2Vec3;
        set_ez(ez: b2Vec3): void;
    }
    class b2MouseJoint extends b2Joint {
        SetTarget(target: b2Vec2): void;
        GetTarget(): b2Vec2;
        SetMaxForce(force: number): void;
        GetMaxForce(): number;
        SetFrequency(hz: number): void;
        GetFrequency(): number;
        SetDampingRatio(ratio: number): void;
        GetDampingRatio(): number;
    }
    class b2MouseJointDef extends b2JointDef {
        constructor();
        get_target(): b2Vec2;
        set_target(target: b2Vec2): void;
        get_maxForce(): number;
        set_maxForce(maxForce: number): void;
        get_frequencyHz(): number;
        set_frequencyHz(frequencyHz: number): void;
        get_dampingRatio(): number;
        set_dampingRatio(dampingRatio: number): void;
    }
    class b2PolygonShape extends b2Shape {
        constructor();
        Set(vertices: b2Vec2, vertexCount: number): void;
        SetAsBox(hx: number, hy: number): void;
        SetAsBox(hx: number, hy: number, center: b2Vec2, angle: number): void;
        GetVertexCount(): number;
        GetVertex(index: number): b2Vec2;
        get_m_centroid(): b2Vec2;
        set_m_centroid(m_centroid: b2Vec2): void;
        get_m_count(): number;
        set_m_count(m_count: number): void;
    }
    class b2PrismaticJoint extends b2Joint {
        GetLocalAnchorA(): b2Vec2;
        GetLocalAnchorB(): b2Vec2;
        GetLocalAxisA(): b2Vec2;
        GetReferenceAngle(): number;
        GetJointTranslation(): number;
        GetJointSpeed(): number;
        IsLimitEnabled(): boolean;
        EnableLimit(flag: boolean): void;
        GetLowerLimit(): number;
        GetUpperLimit(): number;
        SetLimits(lower: number, upper: number): void;
        IsMotorEnabled(): boolean;
        EnableMotor(flag: boolean): void;
        SetMotorSpeed(speed: number): void;
        GetMotorSpeed(): number;
        SetMaxMotorForce(force: number): void;
        GetMaxMotorForce(): number;
        GetMotorForce(inv_dt: number): number;
    }
    class b2PrismaticJointDef extends b2JointDef {
        constructor();
        Initialize(bodyA: b2Body, bodyB: b2Body, anchor: b2Vec2, axis: b2Vec2): void;
        get_localAnchorA(): b2Vec2;
        set_localAnchorA(localAnchorA: b2Vec2): void;
        get_localAnchorB(): b2Vec2;
        set_localAnchorB(localAnchorB: b2Vec2): void;
        get_localAxisA(): b2Vec2;
        set_localAxisA(localAxisA: b2Vec2): void;
        get_referenceAngle(): number;
        set_referenceAngle(referenceAngle: number): void;
        get_enableLimit(): boolean;
        set_enableLimit(enableLimit: boolean): void;
        get_lowerTranslation(): number;
        set_lowerTranslation(lowerTranslation: number): void;
        get_upperTranslation(): number;
        set_upperTranslation(upperTranslation: number): void;
        get_enableMotor(): boolean;
        set_enableMotor(enableMotor: boolean): void;
        get_maxMotorForce(): number;
        set_maxMotorForce(maxMotorForce: number): void;
        get_motorSpeed(): number;
        set_motorSpeed(motorSpeed: number): void;
    }
    class b2Profile {
        get_step(): number;
        set_step(step: number): void;
        get_collide(): number;
        set_collide(collide: number): void;
        get_solve(): number;
        set_solve(solve: number): void;
        get_solveInit(): number;
        set_solveInit(solveInit: number): void;
        get_solveVelocity(): number;
        set_solveVelocity(solveVelocity: number): void;
        get_solvePosition(): number;
        set_solvePosition(solvePosition: number): void;
        get_broadphase(): number;
        set_broadphase(broadphase: number): void;
        get_solveTOI(): number;
        set_solveTOI(solveTOI: number): void;
    }
    class b2PulleyJoint extends b2Joint {
        GetGroundAnchorA(): b2Vec2;
        GetGroundAnchorB(): b2Vec2;
        GetLengthA(): number;
        GetLengthB(): number;
        GetRatio(): number;
        GetCurrentLengthA(): number;
        GetCurrentLengthB(): number;
    }
    class b2PulleyJointDef extends b2JointDef {
        constructor();
        Initialize(bodyA: b2Body, bodyB: b2Body, groundAnchorA: b2Vec2, groundAnchorB: b2Vec2, anchorA: b2Vec2, anchorB: b2Vec2, ratio: number): void;
        get_groundAnchorA(): b2Vec2;
        set_groundAnchorA(groundAnchorA: b2Vec2): void;
        get_groundAnchorB(): b2Vec2;
        set_groundAnchorB(groundAnchorB: b2Vec2): void;
        get_localAnchorA(): b2Vec2;
        set_localAnchorA(localAnchorA: b2Vec2): void;
        get_localAnchorB(): b2Vec2;
        set_localAnchorB(localAnchorB: b2Vec2): void;
        get_lengthA(): number;
        set_lengthA(lengthA: number): void;
        get_lengthB(): number;
        set_lengthB(lengthB: number): void;
        get_ratio(): number;
        set_ratio(ratio: number): void;
    }
    class b2RayCastInput {
        get_p1(): b2Vec2;
        set_p1(p1: b2Vec2): void;
        get_p2(): b2Vec2;
        set_p2(p2: b2Vec2): void;
        get_maxFraction(): number;
        set_maxFraction(maxFraction: number): void;
    }
    class b2RayCastOutput {
        get_normal(): b2Vec2;
        set_normal(normal: b2Vec2): void;
        get_fraction(): number;
        set_fraction(fraction: number): void;
    }
    class b2RevoluteJoint extends b2Joint {
        GetLocalAnchorA(): b2Vec2;
        GetLocalAnchorB(): b2Vec2;
        GetReferenceAngle(): number;
        GetJointAngle(): number;
        GetJointSpeed(): number;
        IsLimitEnabled(): boolean;
        EnableLimit(flag: boolean): void;
        GetLowerLimit(): number;
        GetUpperLimit(): number;
        SetLimits(lower: number, upper: number): void;
        IsMotorEnabled(): boolean;
        EnableMotor(flag: boolean): void;
        SetMotorSpeed(speed: number): void;
        GetMotorSpeed(): number;
        SetMaxMotorTorque(torque: number): void;
        GetMaxMotorTorque(): number;
        GetMotorTorque(inv_dt: number): number;
    }
    class b2RevoluteJointDef extends b2JointDef {
        constructor();
        Initialize(bodyA: b2Body, bodyB: b2Body, anchor: b2Vec2): void;
        get_localAnchorA(): b2Vec2;
        set_localAnchorA(localAnchorA: b2Vec2): void;
        get_localAnchorB(): b2Vec2;
        set_localAnchorB(localAnchorB: b2Vec2): void;
        get_referenceAngle(): number;
        set_referenceAngle(referenceAngle: number): void;
        get_enableLimit(): boolean;
        set_enableLimit(enableLimit: boolean): void;
        get_lowerAngle(): number;
        set_lowerAngle(lowerAngle: number): void;
        get_upperAngle(): number;
        set_upperAngle(upperAngle: number): void;
        get_enableMotor(): boolean;
        set_enableMotor(enableMotor: boolean): void;
        get_motorSpeed(): number;
        set_motorSpeed(motorSpeed: number): void;
        get_maxMotorTorque(): number;
        set_maxMotorTorque(maxMotorTorque: number): void;
    }
    class b2RopeJoint extends b2Joint {
        GetLocalAnchorA(): b2Vec2;
        GetLocalAnchorB(): b2Vec2;
        SetMaxLength(length: number): void;
        GetMaxLength(): number;
        GetLimitState(): b2LimitState;
    }
    class b2RopeJointDef extends b2JointDef {
        constructor();
        get_localAnchorA(): b2Vec2;
        set_localAnchorA(localAnchorA: b2Vec2): void;
        get_localAnchorB(): b2Vec2;
        set_localAnchorB(localAnchorB: b2Vec2): void;
        get_maxLength(): number;
        set_maxLength(maxLength: number): void;
    }
    class b2Rot {
        constructor();
        constructor(angle: number);
        Set(angle: number): void;
        SetIdentity(): void;
        GetAngle(): number;
        GetXAxis(): b2Vec2;
        GetYAxis(): b2Vec2;
        get_s(): number;
        set_s(s: number): void;
        get_c(): number;
        set_c(c: number): void;
    }
    class b2WheelJoint extends b2Joint {
        GetLocalAnchorA(): b2Vec2;
        GetLocalAnchorB(): b2Vec2;
        GetLocalAxisA(): b2Vec2;
        GetJointTranslation(): number;
        GetJointSpeed(): number;
        IsMotorEnabled(): boolean;
        EnableMotor(flag: boolean): void;
        SetMotorSpeed(speed: number): void;
        GetMotorSpeed(): number;
        SetMaxMotorTorque(torque: number): void;
        GetMaxMotorTorque(): number;
        GetMotorTorque(inv_dt: number): number;
        SetSpringFrequencyHz(hz: number): void;
        GetSpringFrequencyHz(): number;
        SetSpringDampingRatio(ratio: number): void;
        GetSpringDampingRatio(): number;
    }
    class b2WheelJointDef extends b2JointDef {
        constructor();
        Initialize(bodyA: b2Body, bodyB: b2Body, anchor: b2Vec2, axis: b2Vec2): void;
        get_localAnchorA(): b2Vec2;
        set_localAnchorA(localAnchorA: b2Vec2): void;
        get_localAnchorB(): b2Vec2;
        set_localAnchorB(localAnchorB: b2Vec2): void;
        get_localAxisA(): b2Vec2;
        set_localAxisA(localAxisA: b2Vec2): void;
        get_enableMotor(): boolean;
        set_enableMotor(enableMotor: boolean): void;
        get_maxMotorTorque(): number;
        set_maxMotorTorque(maxMotorTorque: number): void;
        get_motorSpeed(): number;
        set_motorSpeed(motorSpeed: number): void;
        get_frequencyHz(): number;
        set_frequencyHz(frequencyHz: number): void;
        get_dampingRatio(): number;
        set_dampingRatio(dampingRatio: number): void;
    }
    class b2MotorJoint extends b2Joint {
        SetLinearOffset(linearOffset: b2Vec2): void;
        GetLinearOffset(): b2Vec2;
        SetAngularOffset(angularOffset: number): void;
        GetAngularOffset(): number;
        SetMaxForce(force: number): void;
        GetMaxForce(): number;
        SetMaxTorque(torque: number): void;
        GetMaxTorque(): number;
        SetCorrectionFactor(factor: number): void;
        GetCorrectionFactor(): number;
    }
    class b2MotorJointDef extends b2JointDef {
        constructor();
        Initialize(bodyA: b2Body, bodyB: b2Body): void;
        get_linearOffset(): b2Vec2;
        set_linearOffset(linearOffset: b2Vec2): void;
        get_angularOffset(): number;
        set_angularOffset(angularOffset: number): void;
        get_maxForce(): number;
        set_maxForce(maxForce: number): void;
        get_maxTorque(): number;
        set_maxTorque(maxTorque: number): void;
        get_correctionFactor(): number;
        set_correctionFactor(correctionFactor: number): void;
    }
}