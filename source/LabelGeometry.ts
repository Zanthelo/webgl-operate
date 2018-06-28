
import { assert } from './auxiliaries';

import { Buffer } from './buffer';
import { Context } from './context';
import { Geometry } from './geometry';
import { Initializable } from './initializable';

/**
 * Gathers vertices and other data needed for drawing all labels.
 */
export class LabelGeometry extends Geometry {

    private _bindIndices: Array<GLuint>;

    protected _vertices: Float32Array = new Float32Array(0);
    protected _texCoords: Float32Array = new Float32Array(0);
    protected _origins: Float32Array = new Float32Array(0);
    protected _tans: Float32Array = new Float32Array(0);
    protected _ups: Float32Array = new Float32Array(0);

    /**
     * Object constructor, requires a context and an identifier.
     * @param context - Valid context to create the object for.
     * @param identifier - Meaningful name for identification of this instance.
     */
    constructor(context: Context, identifier?: string) {
        super(context, identifier);

        /* Generate identifier from constructor name if none given. */
        identifier = identifier !== undefined && identifier !== `` ? identifier : this.constructor.name;

        const vertexVBO = new Buffer(context, identifier + 'VBO');
        this._buffers.push(vertexVBO);
        const texCoordBuffer = new Buffer(context, identifier + 'TexCoordBuffer');
        this._buffers.push(texCoordBuffer);
        const originBuffer = new Buffer(context, identifier + 'OriginBuffer');
        this._buffers.push(originBuffer);
        const tanBuffer = new Buffer(context, identifier + 'TanBuffer');
        this._buffers.push(tanBuffer);
        const upBuffer = new Buffer(context, identifier + 'UpBuffer');
        this._buffers.push(upBuffer);
    }

    /**
     * Binds the vertex buffer object (VBO) to an attribute binding point of a given, pre-defined index.
     */
    protected bindBuffers(indices: Array<GLuint>): void {
        const gl = this.context.gl;
        const gl2facade = this.context.gl2facade;

        this._bindIndices = indices;

        /* Please note the implicit bind in attribEnable */
        // quadVertex
        this._buffers[0].attribEnable(indices[0], 2, gl.FLOAT, false, 0, 0, true, false);
        gl2facade.vertexAttribDivisor(indices[0], 0);
        // texCoords
        this._buffers[1].attribEnable(indices[1], 4, gl.FLOAT, false, 4 * 4, 0, true, false);
        gl2facade.vertexAttribDivisor(indices[1], 1);
        // origin
        this._buffers[2].attribEnable(indices[2], 3, gl.FLOAT, false, 3 * 4, 0, true, false);
        gl2facade.vertexAttribDivisor(indices[2], 1);
        // tan
        this._buffers[3].attribEnable(indices[3], 3, gl.FLOAT, false, 3 * 4, 0, true, false);
        gl2facade.vertexAttribDivisor(indices[3], 1);
        // up
        this._buffers[4].attribEnable(indices[4], 3, gl.FLOAT, false, 3 * 4, 0, true, false);
        gl2facade.vertexAttribDivisor(indices[4], 1);
    }

    /**
     * Unbinds the vertex buffer object (VBO) and disables the binding point.
     */
    protected unbindBuffers(indices: Array<GLuint>): void {
        /* Please note the implicit unbind in attribEnable is skipped */
        const l = this._buffers.length;
        for (let i = 0; i < l; i++) {
            this._buffers[i].attribDisable(indices[i], true, true);
        }
    }

    /**
     * Specifies/invokes the draw of all labels.
     */
    @Initializable.assert_initialized()
    draw(): void {
        const gl = this.context.gl;
        const count = this._origins.length / 3;

        // gl.drawElements(gl.TRIANGLE_STRIP, /* TODO */ 4, gl.UNSIGNED_BYTE, 0);
        // gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, count);

        this.bindBuffers(this._bindIndices);

        this.context.gl2facade.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, count);

        this.unbindBuffers(this._bindIndices);

        // for (let i = 0; i < count; i = i + 4) {
        //     gl.drawArrays(gl.TRIANGLE_STRIP, i, 4);
        // }

        // gl.drawArrays(gl.TRIANGLE_STRIP, 0, count);
    }

    /**
     * Creates the vertex buffer object (VBO) and creates and initializes the buffer's data store.
     * // TODO doesnt really initialize the data!
     * @param aQuadVertex - Attribute binding point for vertices.
     * @param aTexCoord - Attribute binding point for texture coordinates.
     * @param aOrigin - Attribute binding point for glyph origin coordinates
     * @param aTan - Attribute binding point for glyph tangent coordinates.
     * @param aUp - Attribute binding point for glyph up-vector coordinates.
     */
    initialize(aQuadVertex: GLuint, aTexCoord: GLuint, aOrigin: GLuint, aTan: GLuint, aUp: GLuint): boolean {

        const gl = this.context.gl;

        // TODO: do not bind index to location 4 // why not?
        const valid = super.initialize(
            [gl.ARRAY_BUFFER, gl.ARRAY_BUFFER, gl.ARRAY_BUFFER, gl.ARRAY_BUFFER, gl.ARRAY_BUFFER]
            , [aQuadVertex, aTexCoord, aOrigin, aTan, aUp]);

        // These vertices are equal for all quads. There actual position will be changed using
        // origin, tan(gent) and up(-vector).
        this._vertices = Float32Array.from([0, 0, 0, 1, 1, 0, 1, 1]);
        this._buffers[0].data(this._vertices, gl.STATIC_DRAW);

        return valid;
    }

    setGlyphCoords(dataOrigin: Float32Array, dataTan: Float32Array, dataUp: Float32Array): void {

        assert(this._buffers[2] !== undefined && this._buffers[0].object instanceof WebGLBuffer,
            `expected valid WebGLBuffer`);
        assert(this._buffers[3] !== undefined && this._buffers[0].object instanceof WebGLBuffer,
            `expected valid WebGLBuffer`);
        assert(this._buffers[4] !== undefined && this._buffers[0].object instanceof WebGLBuffer,
            `expected valid WebGLBuffer`);


        this._origins = dataOrigin;
        this._tans = dataTan;
        this._ups = dataUp;

        const gl = this.context.gl;
        // TODO: is DYNAMIC_DRAW more appropriate?
        this._buffers[2].data(this._origins, gl.STATIC_DRAW);
        this._buffers[3].data(this._tans, gl.STATIC_DRAW);
        this._buffers[4].data(this._ups, gl.STATIC_DRAW);
    }

    setTexCoords(data: Float32Array): void {

        assert(this._buffers[1] !== undefined && this._buffers[1].object instanceof WebGLBuffer,
            `expected valid WebGLBuffer`);

        this._texCoords = data;

        const gl = this.context.gl;
        // TODO: is DYNAMIC_DRAW more appropriate?
        this._buffers[1].data(this._texCoords, gl.STATIC_DRAW);
    }

}
