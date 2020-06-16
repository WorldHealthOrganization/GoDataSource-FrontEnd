import { CaseModel } from '../../../core/models/case.model';
import { ContactModel } from '../../../core/models/contact.model';
import { EventModel } from '../../../core/models/event.model';
import { EntityType } from '../../../core/models/entity-type';
import * as _ from 'lodash';
import { ContactOfContactModel } from '../../../core/models/contact-of-contact.model';

export class SelectedNodes {
    nodes: (CaseModel|ContactModel|EventModel|ContactOfContactModel)[] = [];

    /**
     * Add node to selected nodes list
     * @param node
     */
    addNode(node: CaseModel | EventModel | ContactModel | ContactOfContactModel): void {
        // check if the node is already selected
        if (
            this.nodes.length > 0 &&
            this.sourceNode.id === node.id
        ) {
            // node is already selected
            return;
        }

        // add node to the list
        if (this.nodes.length === 2) {
            // replace the second (target) node
            this.nodes[1] = node;
        } else {
            // add node to the list
            this.nodes.push(node);
        }
    }

    /**
     * Remove node from selected nodes list
     * @param index
     */
    removeNodeAtIndex(index): void {
        this.nodes.splice(index, 1);
    }

    /**
     * Keep only a single node on the selected nodes list
     * @param node
     */
    keepNode(node: CaseModel | EventModel | ContactModel): void {
        this.nodes = _.filter(this.nodes, (selectedNode) => {
            return selectedNode.id === node.id;
        });
    }

    /**
     * Swap selected nodes (change their order)
     */
    swapNodes(): void {
        if (this.nodes.length === 2) {
            // extract the first node from the array
            const firstNode = this.nodes.splice(0, 1)[0];
            // ...and push it back at the end of the array
            this.nodes.push(firstNode);
        }
    }

    /**
     * Get the Source node (aka Exposure)
     */
    get sourceNode(): (CaseModel | EventModel | ContactModel | ContactOfContactModel) {
        return this.nodes[0];
    }

    /**
     * Get the Target node (aka Contact)
     */
    get targetNode(): (CaseModel | EventModel | ContactModel | ContactOfContactModel) {
        return this.nodes[1];
    }

    /**
     * Check if we can create a relationship between selected nodes
     */
    get canCreateRelationship(): boolean {
        return (
            // do we have 2 selected nodes so we can create relationship between them?
            this.nodes.length === 2 &&
            // cannot create relationship between 2 Contacts
            (
                this.sourceNode.type !== EntityType.CONTACT ||
                this.targetNode.type !== EntityType.CONTACT
            ) &&
            // cannot create relationship between 2 Contacts of Contacts and Event/Case and Contact of Contact
            (
                (this.sourceNode.type !== EntityType.EVENT && this.sourceNode.type !== EntityType.CASE) && this.sourceNode.type !== EntityType.CONTACT_OF_CONTACT ||
                this.targetNode.type !== EntityType.CONTACT_OF_CONTACT
            )
        );
    }

    /**
     * Check if we can create a Contact for a selected node
     */
    get canCreateContact(): boolean {
        return (
            // do we have a single Node selected?
            this.nodes.length === 1 &&
            // a Contact can be created only for a Case or an Event
            (
                this.sourceNode.type !== EntityType.CONTACT_OF_CONTACT
            )
        );
    }
}
