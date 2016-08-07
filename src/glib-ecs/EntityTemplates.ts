module Glib {

  export interface EntityTemplate {
    (entity:Entity, options?:any):void
  }

  var register = {};

  export var EntityTemplates = {
    register: function(name:string, template:EntityTemplate) {
      if (register[name]) throw new Error(`Template '${name}' is already registered`);
      register[name] = template;
    },
    get(name:string):EntityTemplate {
      var result = register[name];
      if (!result) throw new Error(`Template '${name}' not found`);
      return result;
    },
    all(){
      return register;
    }
  };

  EntityTemplates.register("Game", gameEntity);
  function gameEntity(entity:Entity, options:any={}){
    entity
      .addService("Device", new Graphics.Device({ canvas: options.canvas }))
      .addComponent(new Glib.Components.GameLoop())
      .addComponent(new Glib.Components.Time())
      .addComponent(new Glib.Components.Fps())
      .addComponent(new Glib.Components.Assets())
      .addComponent(new Glib.Components.Renderer())
      .applyTemplates(options.templates || {})
    if (options.autorun !== false) {
      entity.getService("GameLoop").run();
    }
  }

  export function createGame(options:any, ...templates){
    return new Entity().applyTemplate("Game", options).applyTemplates(templates);
  }

  EntityTemplates.register("Transform", transformEntity);
  function transformEntity(entity:Entity) {
    if (!entity.s.Transform) {
      entity.addComponent(new Components.Transform());
    }
  }

  EntityTemplates.register("Camera", cameraEntity);
  function cameraEntity(entity:Entity, options:any = {}) {
    entity.applyTemplate("Transform");
    if (!entity.s.Camera) {
      entity.addComponent(new Components.Camera(options));
    }
  }

  EntityTemplates.register("DirectionalLight", directionalLightEntity);
  function directionalLightEntity(entity:Entity, options:any = {}) {
    options = options || {};
    options.type = Components.LightType.Directional;
    lightEntity(entity, options);
  }

  EntityTemplates.register("PointLight", pointLightEntity);
  function pointLightEntity(entity:Entity, options:any = {}) {
    options = options || {};
    options.type = Components.LightType.Point;
    lightEntity(entity, options);
  }

  EntityTemplates.register("SpotLight", spotLightEntity);
  function spotLightEntity(entity:Entity, options:any = {}) {
    options = options || {};
    options.type = Components.LightType.Spot;
    lightEntity(entity, options);
  }

  EntityTemplates.register("Light", lightEntity);
  function lightEntity(entity:Entity, options:any = {}) {
    entity.applyTemplate("Transform");
    if (!entity.s.Light) {
      entity.addComponent(new Components.Light(options));
    }
  }

  EntityTemplates.register("Model", modelEntity);
  function modelEntity(entity:Entity, options:any = {}) {
    entity.applyTemplate("Transform");
    if (!entity.s.Renderable) {
      entity.addComponent(new Components.Model(options));
    }
  }

  EntityTemplates.register("Mouse", mouseEntity);
  function mouseEntity(entity:Entity, options:any = {}) {
    if (!entity.s.Mouse) {
      entity.addComponent(new Components.Mouse(options));
    }
  }

  EntityTemplates.register("Keyboard", keyboardEntity);
  function keyboardEntity(entity:Entity, options:any = {}) {
    if (!entity.s.Keyboard) {
      entity.addComponent(new Components.Keyboard(options));
    }
  }

  EntityTemplates.register("WASD", wasdEntity);
  function wasdEntity(entity:Entity, options:any = {}) {
    entity.root.applyTemplate("Mouse");
    entity.root.applyTemplate("Keyboard");
    entity.addComponent(new Components.WASD());
  }
}
