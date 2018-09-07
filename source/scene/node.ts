
import { mat4, quat, vec3 } from 'gl-matrix';
import { m4 } from '../gl-matrix-extensions';


/**
 * Represents a node in a virtual 3D scene.
 * A node usually has a parent node, unless it represents a root node of a scene.
 * A node has a local transformation, which describes the position, orientation,
 * and size of the node in respect to its parent node. It can also contain
 * a geometric representation, i.e., a mesh, and properties which
 * define its appearance in the scene, such as materials or rendering options.
 * A scene renderer is responsible for interpreting these properties
 * when rendering a scene onto the screen.
 */
export class Node {

    /** @see {@link parent} */
    protected _parent: Node | undefined = undefined;

    /** @see {@link children} */
    protected _children: Node[] = [];

    /** @see {@link transform} */
    protected _transform: mat4 | undefined;

    /** @see {@link localTransform} */
    protected _localTransform: mat4 | undefined;

    /** @see {@link translation} */
    protected _translation: vec3 | undefined;

    /** @see {@link rotation} */
    protected _rotation: quat | undefined;

    /** @see {@link scale} */
    protected _scale: vec3 | undefined;

    /** @see {@link altered} */
    protected _altered = false;


    /**
     * Constructor
     */
    constructor(parent: Node) {
        this._parent = parent;
    }

    /**
     * Invalidates derived matrices, i.e., the global transformation matrix.
     */
    protected invalidate(): void {
        this._transform = undefined;
        this._altered = true;
    }

    /**
     * Returns the parent node of this node (can be null).
     */
    get parent(): Node | undefined {
        return this._parent;
    }

    /**
     * Returns the list of child nodes
     */
    get children(): Node[] {
        return this._children;
    }

    /**
     * Returns the transformation of the node relative to the scene (world space).
     */
    get transform(): mat4 {
        if (this._transform) {
            return this._transform;
        }

        // Compute transformation
        this._transform = m4();
        if (this._parent) {
            this._transform = mat4.clone(this._parent.transform);
        }
        mat4.mul(this._transform, this._transform, this.localTransform);

        return this._transform;
    }

    /**
     * Returns the local transformation of the node relative to its parent node.
     */
    get localTransform(): mat4 {
        if (this._localTransform) {
            return this._localTransform;
        }

        // Initialize local transformation
        this._localTransform = m4();

        // Compute local transformation
        if (this.translation && this.rotation && this.scale) {
            this._localTransform = mat4.fromRotationTranslationScale(
                m4(),
                this.rotation!,
                this.translation!,
                this.scale!);
        }

        return this._localTransform;
    }

    /**
     * Returns the translation of the node relative to its parent node.
     */
    get translation(): vec3 | undefined {
        return this._translation;
    }

    /**
     * Returns the rotation of the node relative to its parent node.
     */
    get rotation(): quat | undefined {
        return this._rotation;
    }

    /**
     * Returns the scale of the node relative to its parent node.
     */
    get scale(): vec3 | undefined {
        return this._scale;
    }

    /**
     * Whether or not any other public property has changed. Please note that the alteration status is detached from
     * caching state of lazily computed properties.
     */
    get altered(): boolean {
        return this._altered;
    }

    /**
     * Intended for resetting alteration status.
     */
    set altered(status: boolean) {
        this._altered = status;
    }

}
