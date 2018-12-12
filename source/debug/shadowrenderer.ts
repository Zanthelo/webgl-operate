
import { assert } from '../auxiliaries';

import { Camera } from '../camera';
import { Context } from '../context';
import { DefaultFramebuffer } from '../defaultframebuffer';
import { Framebuffer } from '../framebuffer';
import { MouseEventProvider } from '../mouseeventprovider';
import { Navigation } from '../navigation';
import { Program } from '../program';
import { Renderbuffer } from '../renderbuffer';
import { Invalidate, Renderer } from '../renderer';
import { Shader } from '../shader';
import { Texture2D } from '../texture2d';
import { mat4, vec3 } from '../webgl-operate';
import { Cube } from './cube';
import { Plane } from './plane';


namespace debug {

    export class ShadowRenderer extends Renderer {

        protected _extensions = false;

        protected _defaultFBO: DefaultFramebuffer;
        protected _navigation: Navigation;

        protected _camera: Camera;
        protected _light: Camera;

        protected _cube: Cube;
        protected _plane: Plane;

        protected _intermediateFramebuffer: Framebuffer;
        protected _intermediateColor: Texture2D;
        protected _intermediateDepth: Renderbuffer;

        protected _shadowProgram: Program;
        protected _uLightViewProjection: WebGLUniformLocation;
        protected _uLightModel: WebGLUniformLocation;

        protected _program: Program;
        protected _uViewProjection: WebGLUniformLocation;
        protected _uShadowViewProjection: WebGLUniformLocation;
        protected _uModel: WebGLUniformLocation;
        protected _modelMatrix: WebGLUniformLocation;


        protected onInitialize(context: Context, callback: Invalidate,
            mouseEventProvider: MouseEventProvider,
            /* keyEventProvider: KeyEventProvider, */
            /* touchEventProvider: TouchEventProvider */): boolean {

            const gl = this._context.gl;
            const gl2facade = this._context.gl2facade;

            /* Enable required extensions. */

            if (this._extensions === false && this._context.isWebGL1) {
                assert(this._context.supportsStandardDerivatives, `expected OES_standard_derivatives support`);
                /* tslint:disable-next-line:no-unused-expression */
                this._context.standardDerivatives;
                this._extensions = true;
            }

            /* Create and configure program and geometry. */

            this._intermediateColor = new Texture2D(this._context, 'ColorRenderTexture');
            this._intermediateDepth = new Renderbuffer(this._context, 'DepthRenderbuffer');

            this._intermediateFramebuffer = new Framebuffer(this._context, 'IntermediateFBO');

            const shadowVert = new Shader(this._context, gl.VERTEX_SHADER, 'shadow.vert');
            shadowVert.initialize(require('./shadow.vert'));
            const shadowFrag = new Shader(this._context, gl.FRAGMENT_SHADER, 'shadow.frag');
            shadowFrag.initialize(require('./shadow.frag'));

            this._shadowProgram = new Program(this._context);
            this._shadowProgram.initialize([shadowVert, shadowFrag]);

            const vert = new Shader(this._context, gl.VERTEX_SHADER, 'simple.vert');
            vert.initialize(require('./simple.vert'));
            const frag = new Shader(this._context, gl.FRAGMENT_SHADER, 'simple.frag');
            frag.initialize(require('./simple.frag'));

            this._program = new Program(this._context);
            this._program.initialize([vert, frag]);
            const aVertex = this._program.attribute('a_vertex', 0);

            this._uLightViewProjection = this._shadowProgram.uniform('u_viewProjection');
            this._uLightModel = this._shadowProgram.uniform('u_model');

            this._uViewProjection = this._program.uniform('u_viewProjection');
            this._uShadowViewProjection = this._program.uniform('u_lightViewProjection');
            this._uModel = this._program.uniform('u_model');

            this._cube = new Cube(this._context, 'cube');
            this._cube.initialize(aVertex);

            this._plane = new Plane(this._context, 'plane');
            this._plane.initialize(aVertex);

            this._modelMatrix = mat4.create();

            this._camera = new Camera();
            this._camera.center = vec3.fromValues(0.0, 0.0, 0.0);
            vec3.normalize(this._camera.up, vec3.fromValues(-1.0, 1.0, 0.0));
            this._camera.eye = vec3.fromValues(6.0, 6.0, 0.0);
            this._camera.near = 1.0;
            this._camera.far = 32.0;

            this._light = new Camera();
            this._light.center = vec3.fromValues(0.0, 0.0, 0.0);
            vec3.normalize(this._light.up, vec3.fromValues(0.0, 1.0, -1.0));
            this._light.eye = vec3.fromValues(0.0, 6.0, 6.0);
            this._light.near = 3.0;
            this._light.far = 16.0;

            /* Create framebuffers, textures, and render buffers. */

            this._defaultFBO = new DefaultFramebuffer(this._context, 'DefaultFBO');
            this._defaultFBO.initialize();

            /* Create and configure test navigation. */

            //this._navigation = new Navigation(callback, mouseEventProvider);
            //this._navigation.camera = this._camera;

            return true;
        }

        protected onUninitialize(): void {
            super.uninitialize();

            this._cube.uninitialize();
            this._plane.uninitialize();

            this._intermediateFramebuffer.uninitialize();
            this._defaultFBO.uninitialize();
            this._intermediateColor.uninitialize();
            this._intermediateDepth.uninitialize();
        }


        protected onUpdate(): boolean {
            //this._navigation.update();

            return true;
        }

        protected onPrepare(): void {
            const gl = this._context.gl;
            const gl2facade = this._context.gl2facade;

            if (!this._intermediateFramebuffer.initialized) {
                this._intermediateColor.initialize(
                    this._frameSize[0], this._frameSize[1], gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE);
                this._intermediateDepth.initialize(this._frameSize[0], this._frameSize[1], gl.DEPTH_COMPONENT16);
                this._intermediateFramebuffer.initialize([[gl2facade.COLOR_ATTACHMENT0, this._intermediateColor]
                    , [gl.DEPTH_ATTACHMENT, this._intermediateDepth]]);
                this._intermediateFramebuffer.clearColor([1.0, 1.0, 1.0, 1.0]);
                this._intermediateFramebuffer.clearDepth(1.0);

            } else if (this._altered.frameSize) {
                this._intermediateFramebuffer.resize(this._frameSize[0], this._frameSize[1]);
            }

            if (this._altered.clearColor) {
                this._intermediateFramebuffer.clearColor(this._clearColor);
            }

            this._altered.reset();
        }

        protected onFrame(frameNumber: number): void {
            const gl = this._context.gl;

            gl.viewport(0, 0, this._frameSize[0], this._frameSize[1]);
            gl.enable(gl.DEPTH_TEST);
            //gl.enable(gl.CULL_FACE);

            this._intermediateFramebuffer.clear(gl.COLOR_BUFFER_BIT, true, false);
            //this._defaultFBO.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT, true, false);
            this._shadowProgram.bind();

            gl.uniformMatrix4fv(this._uLightModel, gl.GL_FALSE, this._modelMatrix);
            gl.uniformMatrix4fv(this._uLightViewProjection, gl.GL_FALSE, this._light.viewProjection);

            //gl.cullFace(gl.FRONT);
            this._cube.bind();
            this._cube.draw();
            //gl.cullFace(gl.BACK);
            this._plane.bind();
            this._plane.draw();
            //gl.disable(gl.CULL_FACE);

            this._defaultFBO.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT, true, false);
            this._program.bind();

            gl.uniformMatrix4fv(this._uModel, gl.GL_FALSE, this._modelMatrix);
            gl.uniformMatrix4fv(this._uViewProjection, gl.GL_FALSE, this._camera.viewProjection);
            gl.uniformMatrix4fv(this._uShadowViewProjection, gl.GL_FALSE, this._light.viewProjection);
            this._intermediateColor.bind(gl.TEXTURE0);

            this._cube.bind();
            this._cube.draw();
            this._plane.bind();
            this._plane.draw();
            this._plane.unbind();

            this._program.unbind();
        }

        protected onSwap(): void {
        }


    }

}

export = debug;
